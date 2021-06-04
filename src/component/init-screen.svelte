<script>
    import Button from "svelte-doric/core/button"

    import bridge from "bridge"

    import Panel from "./panel.svelte"
    import {appTheme, kb} from "../state.js"

    import Menu from "./init-screen/menu.svelte"

    let theme = "none"
    let layout = null

    const setup = async () => {
        const kbInfo = await bridge.loadKeyboardFile(layout)
        const keys = await Promise.all(
            kbInfo.data["keyboard.groups"].map(
                (name) => bridge.loadKeyFile(name)
            )
        )
        $appTheme = (theme === "none")
            ? null
            : bridge.resolve(args.themes, theme)
        $kb = keys
    }
</script>

<style>
    options-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        padding: 4px;
        gap: 4px;
    }

    button-thing {
        display: grid;
        grid-column: span 2;
    }
</style>

{#await bridge.loadDisplayOptions()}
    <div>Loading</div>
{:then [layouts, themes]}
    <options-layout>
        <Menu items={["none", ...themes]} bind:value={theme}>
            <svelte:fragment slot="title">
                Theme
            </svelte:fragment>
        </Menu>

        <Menu items={layouts} bind:value={layout}>
            <svelte:fragment slot="title">
                Layout
            </svelte:fragment>
        </Menu>

        {#if layout !== null}
            <button-thing>
                <Button on:tap={setup} color="secondary" variant="outline">
                    Load Keyboard
                </Button>
            </button-thing>
        {/if}
    </options-layout>
{/await}
