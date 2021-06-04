<script>
    import vars from "svelte-doric/core/util/vars"

    export let keyInfo
    export let keyStatus

    $: [key, code, width, height, meta = ""] = keyInfo
    $: span = {width, height}
    $: _class = `kb-${code.toLowerCase()} ${meta}`.trim()
</script>

<style>
    keyboard-key {
        position: relative;
        display: flex;
        border-width: 0px;
        color: var(
            --key-color,
            var(--primary)
        );
        border-radius: 4px;
        align-items: center;
        justify-content: center;
        grid-column: span var(--width);
        grid-row: span var(--height);
        transition: background-color linear 50ms, color linear 50ms;
    }
    keyboard-key::before {
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        content: "";
        z-index: -1;
        background-image: var(--image);
        background-size: var(--bg-size, contain);
        background-repeat: no-repeat;
        background-position: var(--bg-pos, center center);
    }
    keyboard-key[data-on="true"] {
        background-color: var(
            --key-press-highlight,
            var(--text-light)
        );
        color: var(
            --key-press-color,
            var(--text-invert)
        );
        /* transition: none; */
    }
</style>

<keyboard-key use:vars={span} data-on={$keyStatus[code]} class={_class}>
    {key.toUpperCase()}
</keyboard-key>
