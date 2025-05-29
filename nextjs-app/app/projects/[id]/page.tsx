"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";
import ElementThumbnail from "@/app/components/ElementThumbnail";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/lib/api";

const clientNoCdn = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoMode, setInfoMode] = useState(false);
  const [infoTab, setInfoTab] = useState<'information' | 'colophon' | 'login'>('information');
  const [projectExists, setProjectExists] = useState(true);
  const [projectDescription, setProjectDescription] = useState<string | null>(null);

  // Sidebar selection state
  const selectedFilter: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string } = { type: 'project', id: id as string };

  useEffect(() => {
    async function fetchElements() {
      setLoading(true);
      // Fetch project existence and description
      const projectData = await clientNoCdn.fetch('*[_type == "project" && _id == $id][0]', { id });
      if (!projectData) {
        setProjectExists(false);
        setElements([]);
        setProjectDescription(null);
        setLoading(false);
        return;
      }
      setProjectDescription(projectData.description || null);
      const data = await clientNoCdn.fetch(
        '*[_type == "elements"]{_id, eagleId, fileType, fileName, file, url, mainCategory, subCategories, thumbnail, dateAdded, connectedProjects[]->}'
      );
      // Filter for elements connected to this project
      const filtered = (data || []).filter((el: any) =>
        Array.isArray(el.connectedProjects) &&
        el.connectedProjects.some((proj: any) => (proj?._id || proj?._ref) === id)
      );
      setElements(filtered);
      setLoading(false);
    }
    if (id) fetchElements();
  }, [id]);

  // Sidebar navigation handler
  function handleSidebarSelect(filter: { type: 'all' | 'category' | 'subcategory' | 'project'; id?: string }) {
    if (filter.type === 'all') {
      router.push('/');
    } else if (filter.type === 'category' && filter.id) {
      router.push(`/?category=${filter.id}`);
    } else if (filter.type === 'subcategory' && filter.id) {
      router.push(`/?subcategory=${filter.id}`);
    } else if (filter.type === 'project' && filter.id) {
      router.push(`/projects/${filter.id}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-row bg-white dark:bg-black">
      {/* Sidebar */}
      <div className="sticky top-0 h-screen z-10">
        <Sidebar onSelect={handleSidebarSelect} selected={selectedFilter} initialView="projects" />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto max-h-screen text-black dark:text-white">
        {loading ? (
          <div className="text-center text-gray-700 font-[family-name:var(--font-albragrotesk)]">One sec...</div>
        ) : !projectExists ? (
          <div className="text-center text-red-500 text-xl font-bold font-[family-name:var(--font-albragrotesk)]">
            Project not found.
          </div>
        ) : elements.length === 0 ? (
          <div className="text-center text-gray-400 font-[family-name:var(--font-albragrotesk)]">
            No elements found for this project.
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 items-stretch">
              {elements.map((el: any) => (
                <ElementThumbnail key={el._id} element={el} selectedFilter={selectedFilter} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 