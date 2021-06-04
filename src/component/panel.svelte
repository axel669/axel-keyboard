<script>
    export let color
</script>

<style>
    fieldset {
        border: 2px solid var(--primary);
        padding: 4px;
        margin: 0px;
        border-radius: 4px;
    }

    legend:empty {
        display: none;
    }

    legend.primary {
        color: var(--primary);
    }
    legend.secondary {
        color: var(--secondary);
    }
    legend.danger {
        color: var(--danger);
    }
</style>

<fieldset>
    <legend class="{color}">
        <slot name="title" />
    </legend>
    <slot />
</fieldset>
