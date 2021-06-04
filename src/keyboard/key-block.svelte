<script>
    import vars from "svelte-doric/core/util/vars"

    import Key from "./key.svelte"

    export let block
    export let keyStatus

    $: [size, ...keys] = block
</script>

<style>
    keyboard-block {
        background-color: var(--background);
        border: 3px solid var(--primary);
        border-radius: 4px;
        display: inline-grid;
        gap: 4px;
        grid-auto-rows: 32px;
        grid-template-columns: repeat(var(--size), 8px);
        padding: 4px;
        user-select: none;
    }
</style>

<keyboard-block use:vars={{size}}>
    {#each keys as keyInfo}
        <Key {keyInfo} {keyStatus} />
    {/each}
</keyboard-block>
