<script>
    import { onMount } from 'svelte';
    import dayjs from 'dayjs';

    let folders = $state();
    let imageData = $state();
    let imageCount = $state(0);
    let currentImage = $state();
    let newFolder = $state();
    let inputField = $state();
    let currentMD5 = $state();

    function sort(key) {
        let folder;
        if (key === 'y') {
            folder = dayjs(currentImage?.fileStat?.mtime).format('YYYY');
        } else if (key == 'd' || key == 'Delete') {
            folder = 'sort-deleted';
        } else if (key == 'Enter') {
            folder = newFolder;
        } else if (parseInt(key) > -1 && parseInt(key) < 10) {
            folder = folders[parseInt(key) - 1].name;
        } else {
            folder = undefined;
        }
        if (folder) {
            fetch(`http://localhost:3000/moveImage/${currentMD5}/${folder}`);

            fetchFolders();
            imageCount++;

            currentMD5 = Object.keys(imageData)[imageCount];
            currentImage = imageData[currentMD5];
        }
    }

    function onKeyDown(e) {
        if (document.activeElement == inputField && e.key == 'Enter') {
            sort(e.key);
            newFolder = '';
            inputField.blur();
        } else if (document.activeElement !== inputField) {
            sort(e.key);
        }
    }
    function fetchFolders() {
        fetch('http://localhost:3000/folders').then((response) => {
            response.json().then((data) => {
                folders = data.folders.slice(0, 9);
            });
        });
    }

    onMount(() => {
        fetch('http://localhost:3000/unsortedFiles').then((response) => {
            response.json().then((data) => {
                imageData = data;
                imageCount = 0;
                try {
                    currentMD5 = Object.keys(imageData)[imageCount];
                    currentImage = imageData[currentMD5];
                    currentImage.fileStat.sizeMb = (currentImage.fileStat.size / 1024 / 1024).toFixed(2);
                } catch (e) {
                    currentImage = {};
                }
            });
        });
        fetchFolders();
    });
</script>

<main>
    {#if currentMD5}
        <span>{currentImage.fileName}</span>
    {/if}
    <div class="flex-container">
        <div class="stats">
            <div class="flex-container-vertical">
                {#if currentMD5}
                    <span>Created: {dayjs(currentImage?.fileStat?.ctime).format('YYYY-MM-DD HH:mm:ss')}</span>
                    <span>Modified: {dayjs(currentImage?.fileStat?.mtime).format('YYYY-MM-DD HH:mm:ss')}</span>
                    <span>Accessed: {dayjs(currentImage?.fileStat?.atime).format('YYYY-MM-DD HH:mm:ss')}</span>
                    <span>Size: {currentImage?.fileStat?.sizeMb} Mb</span>
                    <span>{imageCount + 1} / {Object.keys(imageData).length + 1}</span>

                    <span class="header">Folders:</span>
                    <span>y: Sort by year</span>
                    <span>d: Delete</span>
                    {#each folders as folder, idx}
                        <span>{idx + 1}: {folder.name}</span>
                    {/each}
                    <input type="text" bind:value={newFolder} placeholder="new" bind:this={inputField} />
                {:else}
                    All done!
                {/if}
            </div>
        </div>

        <div class="image">
            {#if currentImage?.md5}
                <img src={`http://localhost:3000/image/${currentImage.md5}`} alt={currentImage.fileName} />
            {/if}
        </div>
    </div>
</main>
<svelte:window on:keydown={onKeyDown} />

<style>
    .header {
        margin-top: 2em;
    }
    .flex-container {
        display: flex;
    }
    .flex-container-vertical {
        display: flex;
        flex-direction: column;
    }
    .stats {
        text-align: left;
        min-width: 10vw;
        padding-right: 10px;
    }
    .image {
        max-width: 80vw;
        max-height: 95vh;
    }
    .image img {
        max-width: 100%;
        max-height: 100%;
    }
</style>
