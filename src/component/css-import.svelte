<script>
    export let file

    $: formattedFileName = file?.replace(/\\/g, "\\\\")
    $: importString = `<style>@import "${formattedFileName}"</style>`
</script>

{#if file !== null}
    {@html importString}
{/if}
