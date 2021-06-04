<script>
    import AppStyle from "svelte-doric/core/app-style"
    import baseline from "svelte-doric/core/baseline"
    import theme from "svelte-doric/core/theme/tron"

    import {onMount} from "svelte"
    import {writable} from "svelte/store"

    import bridge from "bridge"

    import Keyboard from "./keyboard.svelte"
    import InitScreen from "./component/init-screen.svelte"
    import CSSImport from "./component/css-import.svelte"

    import {kb, appTheme} from "./state.js"

    let layout = null
    const resize = (elem) => {
        if (elem === null) {
            return
        }

        const box = elem.getBoundingClientRect()
        bridge.resizeWindow(box.width, box.height)
    }
    $: resize(layout)

    let showKeyboard = true
</script>

<style>
    :global(body) {
        overflow: hidden;
    }
    app-layout {
        display: inline-grid;
        grid-template-columns: min-content auto;
    }

    keyboard-area {
        display: block;
        opacity: 0;
    }
    .showKeyboard {
        opacity: 1;
    }
</style>

<svelte:window on:toggle-visible={() => showKeyboard = !showKeyboard} />

<AppStyle {baseline} {theme} />

<CSSImport file={$appTheme} />

{#if $kb === null}
    <InitScreen />
{:else}
    <app-layout bind:this={layout}>
        <keyboard-area class:showKeyboard class="override">
            <Keyboard blocks={$kb} />
        </keyboard-area>
    </app-layout>
{/if}
