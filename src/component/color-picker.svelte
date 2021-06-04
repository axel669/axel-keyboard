<script>
    import {vars} from "svelte-doric"

    export let value

    $: status = {
        "bg": value
    }
</script>

<style>
    color-picker {
        position: relative;
        display: block;
        background-color: var(--bg);
        width: 100px;
        height: 32px;
    }

    input {
        opacity: 0;
        position: absolute;
        top: 0px;
        left: 0px;
        width: 100%;
        height: 100%;
        cursor: pointer;
    }
</style>

<color-picker use:vars={status}>
    <input type="color" bind:value />
</color-picker>
