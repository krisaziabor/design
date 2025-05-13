<?php snippet('header') ?>

<main class="main">
    <h1><?= $page->title() ?></h1>
    
    <?php if($page->text()->isNotEmpty()): ?>
        <div class="text">
            <?= $page->text()->kt() ?>
        </div>
    <?php endif ?>
</main>

<?php snippet('footer') ?> 