<script>
    import Panel from "../panel.svelte"

    export let items
    export let value

    const match = (opt) => opt === value
    const set = (opt) =>
        () => value = opt
</script>

<style>
    menu-item {
        display: block;
        padding: 8px;
        cursor: pointer;
        border: 1px solid transparent;
        user-select: none;
    }
    menu-item:hover {
        border-color: var(--primary);
    }
    menu-item.selected::before {
        content: ">";
        padding-right: 8px;
    }
</style>

<Panel>
    <svelte:fragment slot="title">
        <slot name="title" />
    </svelte:fragment>
    {#each items as option}
        <menu-item class:selected={match(option, value)} on:tap={set(option)}>
            {option}
        </menu-item>
    {/each}
</Panel>
