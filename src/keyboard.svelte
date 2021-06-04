<script>
    import {writable} from "svelte/store"

    import vars from "svelte-doric/core/util/vars"

    import KeyBlock from "./keyboard/key-block.svelte"
    import rawkeyMap from "./keyboard/rawkey-map.js"

    export let blocks

    const keyStatus = writable({})
    const resetKeys = () => keyStatus.set({})

    const globalKeyDown = (evt) => {
        const {detail} = evt
        const keyName = rawkeyMap[detail.keycode]
        if ($keyStatus[keyName] === true) {
            return
        }
        keyStatus.update(
            status => ({
                ...status,
                [keyName]: true
            })
        )
    }
    const globalKeyUp = (evt) => {
        const {detail} = evt
        const keyName = rawkeyMap[detail.keycode]
        keyStatus.update(
            status => ({
                ...status,
                [keyName]: false
            })
        )
    }

    $: cols = blocks.length
</script>

<style>
    keyboard-layout {
        display: inline-grid;
        grid-template-columns: repeat(var(--cols), auto);
        gap: 4px;
        border-radius: 4px;
        overflow: hidden;
    }
</style>

<svelte:window
    on:keydown-global={globalKeyDown}
    on:keyup-global={globalKeyUp}
/>

<keyboard-layout use:vars={{cols}}>
    {#each blocks as block}
        <KeyBlock {keyStatus} {block}/>
    {/each}
</keyboard-layout>
