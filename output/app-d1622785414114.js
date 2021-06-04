(function (bridge) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var bridge__default = /*#__PURE__*/_interopDefaultLegacy(bridge);

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const touchState = {};

    if (typeof window !== "undefined") {
        const pointerStart = "pointer-start";
        const pointerEnd = "pointer-end";
        const evtOptions = {bubbles: true};

        const isMobile = (window.ontouchstart !== undefined);
        const sourceEvents = isMobile
            ? {down: "touchstart", up: "touchend"}
            : {down: "mousedown", up: "mouseup"};

        window.addEventListener(
            sourceEvents.down,
            evt => {
                if (isMobile === false && evt.button !== 0) {
                    return
                }
                const customEvent = new CustomEvent(pointerStart, evtOptions);
                evt.identifier = evt.identifier ?? -1;
                customEvent.changedTouches = isMobile ? evt.changedTouches : [evt];
                evt.target.dispatchEvent(customEvent);
            },
            {capture: true}
        );
        window.addEventListener(
            sourceEvents.up,
            evt => {
                if (isMobile === false && evt.button !== 0) {
                    return
                }
                const customEvent = new CustomEvent(pointerEnd, evtOptions);
                evt.identifier = evt.identifier ?? -1;
                customEvent.changedTouches = isMobile ? evt.changedTouches : [evt];
                evt.target.dispatchEvent(customEvent);
            },
            {capture: true}
        );

        window.addEventListener(
            pointerStart,
            evt => {
                const timestamp = Date.now();
                for (const touch of evt.changedTouches) {
                    touchState[touch.identifier] = {
                        timestamp,
                        touch,
                    };
                }
            },
            {capture: true}
        );
        window.addEventListener(
            pointerEnd,
            evt => {
                const timestamp = Date.now();
                for (const touch of evt.changedTouches) {
                    const prev = touchState[touch.identifier];
                    touchState[touch.identifier] = null;

                    if (prev === null || prev === undefined) {
                        return
                    }

                    const duration = timestamp - prev.timestamp;
                    const dist = Math.sqrt(
                        (prev.touch.clientX - touch.clientX) ** 2
                        + (prev.touch.clientY - touch.clientY) ** 2
                    );
                    if (dist > 30 || duration > 500) {
                        return
                    }

                    const customEvent = new CustomEvent("tap", evtOptions);
                    customEvent.changedTouches = [touch];
                    touch.target.dispatchEvent(customEvent);
                }
            },
            {capture: true}
        );
    }

    /* node_modules\svelte-doric\core\app-style.svelte generated by Svelte v3.38.2 */

    function create_fragment(ctx) {
    	let switch_instance0;
    	let t;
    	let switch_instance1;
    	let switch_instance1_anchor;
    	let current;
    	var switch_value = /*theme*/ ctx[0];

    	function switch_props(ctx) {
    		return {};
    	}

    	if (switch_value) {
    		switch_instance0 = new switch_value(switch_props());
    	}

    	var switch_value_1 = /*baseline*/ ctx[1];

    	function switch_props_1(ctx) {
    		return {};
    	}

    	if (switch_value_1) {
    		switch_instance1 = new switch_value_1(switch_props_1());
    	}

    	return {
    		c() {
    			if (switch_instance0) create_component(switch_instance0.$$.fragment);
    			t = space();
    			if (switch_instance1) create_component(switch_instance1.$$.fragment);
    			switch_instance1_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance0) {
    				mount_component(switch_instance0, target, anchor);
    			}

    			insert(target, t, anchor);

    			if (switch_instance1) {
    				mount_component(switch_instance1, target, anchor);
    			}

    			insert(target, switch_instance1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (switch_value !== (switch_value = /*theme*/ ctx[0])) {
    				if (switch_instance0) {
    					group_outros();
    					const old_component = switch_instance0;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance0 = new switch_value(switch_props());
    					create_component(switch_instance0.$$.fragment);
    					transition_in(switch_instance0.$$.fragment, 1);
    					mount_component(switch_instance0, t.parentNode, t);
    				} else {
    					switch_instance0 = null;
    				}
    			}

    			if (switch_value_1 !== (switch_value_1 = /*baseline*/ ctx[1])) {
    				if (switch_instance1) {
    					group_outros();
    					const old_component = switch_instance1;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value_1) {
    					switch_instance1 = new switch_value_1(switch_props_1());
    					create_component(switch_instance1.$$.fragment);
    					transition_in(switch_instance1.$$.fragment, 1);
    					mount_component(switch_instance1, switch_instance1_anchor.parentNode, switch_instance1_anchor);
    				} else {
    					switch_instance1 = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance0) transition_in(switch_instance0.$$.fragment, local);
    			if (switch_instance1) transition_in(switch_instance1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance0) transition_out(switch_instance0.$$.fragment, local);
    			if (switch_instance1) transition_out(switch_instance1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (switch_instance0) destroy_component(switch_instance0, detaching);
    			if (detaching) detach(t);
    			if (detaching) detach(switch_instance1_anchor);
    			if (switch_instance1) destroy_component(switch_instance1, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { theme = null } = $$props;
    	let { baseline = null } = $$props;

    	$$self.$$set = $$props => {
    		if ("theme" in $$props) $$invalidate(0, theme = $$props.theme);
    		if ("baseline" in $$props) $$invalidate(1, baseline = $$props.baseline);
    	};

    	return [theme, baseline];
    }

    class App_style extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { theme: 0, baseline: 1 });
    	}
    }

    /* node_modules\svelte-doric\core\baseline.svelte generated by Svelte v3.38.2 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-74u6mc-style";
    	style.textContent = "*{box-sizing:border-box}html{margin:0px;padding:0px;width:100%;height:100%}body{margin:0px;padding:0px;width:100%;height:100%;-webkit-tap-highlight-color:transparent;font-family:var(--font);background-color:var(--background);color:var(--text-normal);font-size:var(--text-size);--button-default-fill:#aaaaaa;--button-default-text:var(--text-dark);--button-primary:var(--primary);--button-primary-text:var(--text-dark);--button-primary-ripple:var(--primary-ripple);--button-secondary:var(--secondary);--button-secondary-text:var(--text-dark);--button-secondary-ripple:var(--secondary-ripple);--button-danger:var(--danger);--button-danger-text:var(--text-dark);--button-danger-ripple:var(--danger-ripple);--button-filled-ripple:var(--ripple-invert);--card-background:var(--background-layer);--card-border:var(--layer-border-width) solid var(--layer-border-color);--control-border:var(--text-secondary);--control-border-focus:var(--primary);--control-border-error:var(--danger);--title-bar-background:var(--primary);--title-bar-text:var(--text-invert)}";
    	append(document.head, style);
    }

    function create_fragment$1(ctx) {
    	let link0;
    	let link1;
    	let link2;

    	return {
    		c() {
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			attr(link0, "href", "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700");
    			attr(link0, "rel", "stylesheet");
    			attr(link0, "type", "text/css");
    			attr(link1, "href", "https://fonts.googleapis.com/css?family=Inconsolata:300,400,500,700");
    			attr(link1, "rel", "stylesheet");
    			attr(link1, "type", "text/css");
    			attr(link2, "href", "https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined");
    			attr(link2, "rel", "stylesheet");
    		},
    		m(target, anchor) {
    			append(document.head, link0);
    			append(document.head, link1);
    			append(document.head, link2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			detach(link0);
    			detach(link1);
    			detach(link2);
    		}
    	};
    }

    class Baseline extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-74u6mc-style")) add_css();
    		init(this, options, null, create_fragment$1, safe_not_equal, {});
    	}
    }

    const css = (parts, ...values) => {
        const css = parts
            .reduce(
                (cssParts, part, index) => [
                    ...cssParts,
                    part,
                    values[index] ?? ""
                ],
                []
            )
            .join("");
        return `<style>\n${css}\n</style>`
    };
    css.default = css;

    var css_1 = css;

    /* node_modules\svelte-doric\core\theme\tron.svelte generated by Svelte v3.38.2 */

    function create_fragment$2(ctx) {
    	let html_tag;
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(/*theme*/ ctx[0], target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    function instance$1($$self) {
    	const theme = css_1`
        body {
            --font: Inconsolata;
            --background: #030303;
            --background-layer: #080808;
            --layer-border-width: 1px;
            --layer-border-color: var(--text-normal);

            --ripple-dark: #00000060;
            --ripple-light: #FFFFFF60;
            --text-light: white;
            --text-dark: black;

            --primary: #00aaff;
            --primary-light: #79c0f7;
            --primary-ripple: #00aaff60;
            --secondary: #2fbc2f;
            --secondary-ripple: #2fbc2f60;
            --danger: #df5348;
            --danger-ripple: #df534860;

            --text-normal: var(--text-light);
            --text-secondary: #a0a0a0;
            --text-invert: var(--text-dark);

            --text-size: 14px;
            --text-size-title: 18px;
            --text-size-header: 16px;
            --text-size-info: 13px;
            --text-size-secondary: 12px;

            --ripple-normal: var(--ripple-light);
            --ripple-invert: var(--ripple-dark);
        }
    `;

    	return [theme];
    }

    class Tron extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, {});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const calcValue = value => {
        if (Array.isArray(value) === false) {
            return value
        }
        if (value[0] === null || value[0] === undefined) {
            return null
        }
        return value.join("")
    };
    const udpateVars = (node, current, next) => {
        const keys = new Set([
            ...Object.keys(current),
            ...Object.keys(next),
        ]);
        for (const key of keys) {
            const varName = `--${key}`;
            const currentValue = calcValue(current[key]);
            const nextValue = calcValue(next[key]);
            if (nextValue === undefined || nextValue === null) {
                node.style.removeProperty(varName);
            }
            if (currentValue !== nextValue) {
                node.style.setProperty(varName, nextValue);
            }
        }
    };
    const vars = (node, vars) => {
        let currentVars = vars;
        udpateVars(node, {}, currentVars);
        return {
            update(newVars) {
                udpateVars(node, currentVars, newVars);
                currentVars = newVars;
            }
        }
    };

    var vars_1 = vars;

    /* src\keyboard\key.svelte generated by Svelte v3.38.2 */

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-di7sr0-style";
    	style.textContent = "keyboard-key.svelte-di7sr0{position:relative;display:flex;border-width:0px;color:var(\r\n            --key-color,\r\n            var(--primary)\r\n        );border-radius:4px;align-items:center;justify-content:center;grid-column:span var(--width);grid-row:span var(--height);transition:background-color linear 50ms, color linear 50ms}keyboard-key.svelte-di7sr0::before{position:absolute;top:0px;left:0px;right:0px;bottom:0px;content:\"\";z-index:-1;background-image:var(--image);background-size:var(--bg-size, contain);background-repeat:no-repeat;background-position:var(--bg-pos, center center)}keyboard-key[data-on=\"true\"].svelte-di7sr0{background-color:var(\r\n            --key-press-highlight,\r\n            var(--text-light)\r\n        );color:var(\r\n            --key-press-color,\r\n            var(--text-invert)\r\n        )}";
    	append(document.head, style);
    }

    function create_fragment$3(ctx) {
    	let keyboard_key;
    	let t_value = /*key*/ ctx[2].toUpperCase() + "";
    	let t;
    	let keyboard_key_data_on_value;
    	let keyboard_key_class_value;
    	let vars_action;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			keyboard_key = element("keyboard-key");
    			t = text(t_value);
    			set_custom_element_data(keyboard_key, "data-on", keyboard_key_data_on_value = /*$keyStatus*/ ctx[5][/*code*/ ctx[1]]);
    			set_custom_element_data(keyboard_key, "class", keyboard_key_class_value = "" + (null_to_empty(/*_class*/ ctx[4]) + " svelte-di7sr0"));
    		},
    		m(target, anchor) {
    			insert(target, keyboard_key, anchor);
    			append(keyboard_key, t);

    			if (!mounted) {
    				dispose = action_destroyer(vars_action = vars_1.call(null, keyboard_key, /*span*/ ctx[3]));
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*key*/ 4 && t_value !== (t_value = /*key*/ ctx[2].toUpperCase() + "")) set_data(t, t_value);

    			if (dirty & /*$keyStatus, code*/ 34 && keyboard_key_data_on_value !== (keyboard_key_data_on_value = /*$keyStatus*/ ctx[5][/*code*/ ctx[1]])) {
    				set_custom_element_data(keyboard_key, "data-on", keyboard_key_data_on_value);
    			}

    			if (dirty & /*_class*/ 16 && keyboard_key_class_value !== (keyboard_key_class_value = "" + (null_to_empty(/*_class*/ ctx[4]) + " svelte-di7sr0"))) {
    				set_custom_element_data(keyboard_key, "class", keyboard_key_class_value);
    			}

    			if (vars_action && is_function(vars_action.update) && dirty & /*span*/ 8) vars_action.update.call(null, /*span*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(keyboard_key);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let key;
    	let code;
    	let width;
    	let height;
    	let meta;
    	let span;
    	let _class;

    	let $keyStatus,
    		$$unsubscribe_keyStatus = noop,
    		$$subscribe_keyStatus = () => ($$unsubscribe_keyStatus(), $$unsubscribe_keyStatus = subscribe(keyStatus, $$value => $$invalidate(5, $keyStatus = $$value)), keyStatus);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_keyStatus());
    	let { keyInfo } = $$props;
    	let { keyStatus } = $$props;
    	$$subscribe_keyStatus();

    	$$self.$$set = $$props => {
    		if ("keyInfo" in $$props) $$invalidate(6, keyInfo = $$props.keyInfo);
    		if ("keyStatus" in $$props) $$subscribe_keyStatus($$invalidate(0, keyStatus = $$props.keyStatus));
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*keyInfo*/ 64) {
    			 $$invalidate(2, [key, code, width, height, meta = ""] = keyInfo, key, ($$invalidate(1, code), $$invalidate(6, keyInfo)), ($$invalidate(7, width), $$invalidate(6, keyInfo)), ($$invalidate(8, height), $$invalidate(6, keyInfo)), ($$invalidate(9, meta), $$invalidate(6, keyInfo)));
    		}

    		if ($$self.$$.dirty & /*width, height*/ 384) {
    			 $$invalidate(3, span = { width, height });
    		}

    		if ($$self.$$.dirty & /*code, meta*/ 514) {
    			 $$invalidate(4, _class = `kb-${code.toLowerCase()} ${meta}`.trim());
    		}
    	};

    	return [keyStatus, code, key, span, _class, $keyStatus, keyInfo, width, height, meta];
    }

    class Key extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-di7sr0-style")) add_css$1();
    		init(this, options, instance$2, create_fragment$3, safe_not_equal, { keyInfo: 6, keyStatus: 0 });
    	}
    }

    /* src\keyboard\key-block.svelte generated by Svelte v3.38.2 */

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-ssz94q-style";
    	style.textContent = "keyboard-block.svelte-ssz94q{background-color:var(--background);border:3px solid var(--primary);border-radius:4px;display:inline-grid;gap:4px;grid-auto-rows:32px;grid-template-columns:repeat(var(--size), 8px);padding:4px;user-select:none}";
    	append(document.head, style);
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (27:4) {#each keys as keyInfo}
    function create_each_block(ctx) {
    	let key;
    	let current;

    	key = new Key({
    			props: {
    				keyInfo: /*keyInfo*/ ctx[4],
    				keyStatus: /*keyStatus*/ ctx[0]
    			}
    		});

    	return {
    		c() {
    			create_component(key.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(key, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const key_changes = {};
    			if (dirty & /*keys*/ 4) key_changes.keyInfo = /*keyInfo*/ ctx[4];
    			if (dirty & /*keyStatus*/ 1) key_changes.keyStatus = /*keyStatus*/ ctx[0];
    			key.$set(key_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(key.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(key.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(key, detaching);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let keyboard_block;
    	let vars_action;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*keys*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			keyboard_block = element("keyboard-block");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_custom_element_data(keyboard_block, "class", "svelte-ssz94q");
    		},
    		m(target, anchor) {
    			insert(target, keyboard_block, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(keyboard_block, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(vars_action = vars_1.call(null, keyboard_block, { size: /*size*/ ctx[1] }));
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*keys, keyStatus*/ 5) {
    				each_value = /*keys*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(keyboard_block, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (vars_action && is_function(vars_action.update) && dirty & /*size*/ 2) vars_action.update.call(null, { size: /*size*/ ctx[1] });
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(keyboard_block);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let size;
    	let keys;
    	let { block } = $$props;
    	let { keyStatus } = $$props;

    	$$self.$$set = $$props => {
    		if ("block" in $$props) $$invalidate(3, block = $$props.block);
    		if ("keyStatus" in $$props) $$invalidate(0, keyStatus = $$props.keyStatus);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*block*/ 8) {
    			 $$invalidate(1, [size, ...keys] = block, size, ($$invalidate(2, keys), $$invalidate(3, block)));
    		}
    	};

    	return [keyStatus, size, keys, block];
    }

    class Key_block extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-ssz94q-style")) add_css$2();
    		init(this, options, instance$3, create_fragment$4, safe_not_equal, { block: 3, keyStatus: 0 });
    	}
    }

    var rawkeyMap = {
        41: "Backquote",
        2: "Digit1",
        3: "Digit2",
        4: "Digit3",
        5: "Digit4",
        6: "Digit5",
        7: "Digit6",
        8: "Digit7",
        9: "Digit8",
        10: "Digit9",
        11: "Digit0",
        12: "Minus",
        13: "Equal",
        14: "Backspace",
        15: "Tab",
        16: "KeyQ",
        17: "KeyW",
        18: "KeyE",
        19: "KeyR",
        20: "KeyT",
        21: "KeyY",
        22: "KeyU",
        23: "KeyI",
        24: "KeyO",
        25: "KeyP",
        26: "BracketLeft",
        27: "BracketRight",
        43: "Backslash",
        58: "CapsLock",
        30: "KeyA",
        31: "KeyS",
        32: "KeyD",
        33: "KeyF",
        34: "KeyG",
        35: "KeyH",
        36: "KeyJ",
        37: "KeyK",
        38: "KeyL",
        39: "Semicolon",
        40: "Quote",
        28: "Enter",
        42: "ShiftLeft",
        44: "KeyZ",
        45: "KeyX",
        46: "KeyC",
        47: "KeyV",
        48: "KeyB",
        49: "KeyN",
        50: "KeyM",
        51: "Comma",
        52: "Period",
        53: "Slash",
        54: "ShiftRight",
        29: "ControlLeft",
        3675: "MetaLeft",
        56: "AltLeft",
        57: "Space",
        3640: "AltRight",
        3676: "MetaRight",
        3677: "ContentMenu",
        3613: "ControlRight",
        61010: "Insert",
        60999: "Home",
        61001: "PageUp",
        61011: "Delete",
        61007: "End",
        61009: "PageDown",
        61000: "ArrowUp",
        61003: "ArrowLeft",
        61008: "ArrowDown",
        61005: "ArrowRight",
        69: "NumLock",
        3637: "NumpadDivide",
        55: "NumpadMultiply",
        74: "NumpadSubtract",
        71: "Numpad7",
        72: "Numpad8",
        73: "Numpad9",
        78: "NumpadAdd",
        75: "Numpad4",
        76: "Numpad5",
        77: "Numpad6",
        79: "Numpad1",
        80: "Numpad2",
        81: "Numpad3",
        3612: "NumpadEnter",
        82: "Numpad0",
        83: "NumpadDecimal",
    };

    /* src\keyboard.svelte generated by Svelte v3.38.2 */

    function add_css$3() {
    	var style = element("style");
    	style.id = "svelte-csobfs-style";
    	style.textContent = "keyboard-layout.svelte-csobfs{display:inline-grid;grid-template-columns:repeat(var(--cols), auto);gap:4px;border-radius:4px;overflow:hidden}";
    	append(document.head, style);
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (57:4) {#each blocks as block}
    function create_each_block$1(ctx) {
    	let keyblock;
    	let current;

    	keyblock = new Key_block({
    			props: {
    				keyStatus: /*keyStatus*/ ctx[2],
    				block: /*block*/ ctx[7]
    			}
    		});

    	return {
    		c() {
    			create_component(keyblock.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(keyblock, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const keyblock_changes = {};
    			if (dirty & /*blocks*/ 1) keyblock_changes.block = /*block*/ ctx[7];
    			keyblock.$set(keyblock_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(keyblock.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(keyblock.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(keyblock, detaching);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let keyboard_layout;
    	let vars_action;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*blocks*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			keyboard_layout = element("keyboard-layout");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_custom_element_data(keyboard_layout, "class", "svelte-csobfs");
    		},
    		m(target, anchor) {
    			insert(target, keyboard_layout, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(keyboard_layout, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "keydown-global", /*globalKeyDown*/ ctx[3]),
    					listen(window, "keyup-global", /*globalKeyUp*/ ctx[4]),
    					action_destroyer(vars_action = vars_1.call(null, keyboard_layout, { cols: /*cols*/ ctx[1] }))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*keyStatus, blocks*/ 5) {
    				each_value = /*blocks*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(keyboard_layout, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (vars_action && is_function(vars_action.update) && dirty & /*cols*/ 2) vars_action.update.call(null, { cols: /*cols*/ ctx[1] });
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(keyboard_layout);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let cols;
    	let $keyStatus;
    	let { blocks } = $$props;
    	const keyStatus = writable({});
    	component_subscribe($$self, keyStatus, value => $$invalidate(5, $keyStatus = value));

    	const globalKeyDown = evt => {
    		const { detail } = evt;
    		const keyName = rawkeyMap[detail.keycode];

    		if ($keyStatus[keyName] === true) {
    			return;
    		}

    		keyStatus.update(status => ({ ...status, [keyName]: true }));
    	};

    	const globalKeyUp = evt => {
    		const { detail } = evt;
    		const keyName = rawkeyMap[detail.keycode];
    		keyStatus.update(status => ({ ...status, [keyName]: false }));
    	};

    	$$self.$$set = $$props => {
    		if ("blocks" in $$props) $$invalidate(0, blocks = $$props.blocks);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*blocks*/ 1) {
    			 $$invalidate(1, cols = blocks.length);
    		}
    	};

    	return [blocks, cols, keyStatus, globalKeyDown, globalKeyUp];
    }

    class Keyboard extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-csobfs-style")) add_css$3();
    		init(this, options, instance$4, create_fragment$5, safe_not_equal, { blocks: 0 });
    	}
    }

    /* node_modules\svelte-doric\core\ripple.svelte generated by Svelte v3.38.2 */

    function add_css$4() {
    	var style = element("style");
    	style.id = "svelte-acwzgw-style";
    	style.textContent = "ripple-wrapper.svelte-acwzgw{position:absolute;top:0px;left:0px;right:0px;bottom:0px;overflow:hidden}ripple.svelte-acwzgw{width:var(--size);height:var(--size);border-radius:50%;background-color:var(--ripple-color, var(--ripple-normal));position:absolute;left:var(--x);top:var(--y);transform:translate3d(-50%, -50%, 0);pointer-events:none;box-shadow:0px 0px 2px rgba(0, 0, 0, 0.25)}";
    	append(document.head, style);
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (107:4) {#each ripples as info (info.id)}
    function create_each_block$2(key_1, ctx) {
    	let ripple;
    	let vars_action;
    	let ripple_intro;
    	let mounted;
    	let dispose;

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			ripple = element("ripple");
    			attr(ripple, "class", "svelte-acwzgw");
    			this.first = ripple;
    		},
    		m(target, anchor) {
    			insert(target, ripple, anchor);

    			if (!mounted) {
    				dispose = action_destroyer(vars_action = vars_1.call(null, ripple, /*rippleVars*/ ctx[4](/*info*/ ctx[8], /*color*/ ctx[0])));
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (vars_action && is_function(vars_action.update) && dirty & /*ripples, color*/ 3) vars_action.update.call(null, /*rippleVars*/ ctx[4](/*info*/ ctx[8], /*color*/ ctx[0]));
    		},
    		i(local) {
    			if (!ripple_intro) {
    				add_render_callback(() => {
    					ripple_intro = create_in_transition(ripple, customAnimation, {});
    					ripple_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(ripple);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let ripple_wrapper;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let each_value = /*ripples*/ ctx[1];
    	const get_key = ctx => /*info*/ ctx[8].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	return {
    		c() {
    			ripple_wrapper = element("ripple-wrapper");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_custom_element_data(ripple_wrapper, "class", "svelte-acwzgw");
    		},
    		m(target, anchor) {
    			insert(target, ripple_wrapper, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ripple_wrapper, null);
    			}

    			/*ripple_wrapper_binding*/ ctx[6](ripple_wrapper);

    			if (!mounted) {
    				dispose = listen(ripple_wrapper, "pointer-start", /*addRipple*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*rippleVars, ripples, color*/ 19) {
    				each_value = /*ripples*/ ctx[1];
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ripple_wrapper, destroy_block, create_each_block$2, null, get_each_context$2);
    			}
    		},
    		i(local) {
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(ripple_wrapper);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*ripple_wrapper_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    const calcOffset = touch => {
    	const { target, clientX, clientY } = touch;
    	const rect = target.getBoundingClientRect();
    	const x = clientX - rect.left;
    	const y = clientY - rect.top;
    	return { x, y };
    };

    const customAnimation = (node, options) => {
    	return {
    		delay: 0,
    		duration: 500,
    		css: (t, u) => `
                transform: translate3d(-50%, -50%, 0) scale(${1 - u ** 1.3});
                opacity: ${u ** 1.3};
            `
    	};
    };

    const duration = 500;

    function instance$5($$self, $$props, $$invalidate) {
    	let { color = null } = $$props;
    	let { disabled = false } = $$props;
    	let ripples = [];
    	let container = null;

    	const addRipple = evt => {
    		if (disabled === true) {
    			return;
    		}

    		for (const touch of evt.changedTouches) {
    			const { x, y } = calcOffset(touch);
    			const size = Math.max(container.offsetWidth, container.offsetHeight) * 2;
    			const ripple = { id: Date.now(), x, y, size };
    			$$invalidate(1, ripples = [...ripples, ripple]);
    			setTimeout(() => $$invalidate(1, ripples = ripples.filter(r => r !== ripple)), duration);
    		}
    	};

    	const rippleVars = (info, color) => ({
    		"x": [info.x, "px"],
    		"y": [info.y, "px"],
    		"size": [info.size, "px"],
    		"ripple-color": color
    	});

    	function ripple_wrapper_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(2, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$props.disabled);
    	};

    	return [
    		color,
    		ripples,
    		container,
    		addRipple,
    		rippleVars,
    		disabled,
    		ripple_wrapper_binding
    	];
    }

    class Ripple extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-acwzgw-style")) add_css$4();
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, { color: 0, disabled: 5 });
    	}
    }

    /* node_modules\svelte-doric\core\button.svelte generated by Svelte v3.38.2 */

    function add_css$5() {
    	var style = element("style");
    	style.id = "svelte-k4pik7-style";
    	style.textContent = "doric-button.svelte-k4pik7{position:relative;padding:8px 16px;border-radius:4px;user-select:none;cursor:pointer;overflow:hidden;box-sizing:border-box;vertical-align:middle;display:inline-flex;justify-content:center;align-items:center;z-index:+1;font-weight:500;--button-color:var(--text-normal);--fill-color:var(--button-default-fill);--text-color:var(--button-default-text);color:var(--button-color)}.round.svelte-k4pik7{min-width:var(--button-round-size);height:var(--button-round-size);padding:8px;border-radius:var(--button-round-size)}.fab.svelte-k4pik7{width:var(--button-round-size);padding:0px}.disabled.svelte-k4pik7{filter:contrast(50%)}.primary.svelte-k4pik7{--button-color:var(--button-primary);--fill-color:var(--button-primary);--ripple-color:var(--button-primary-ripple);--text-color:var(--button-primary-text)}.secondary.svelte-k4pik7{--button-color:var(--button-secondary);--fill-color:var(--button-secondary);--ripple-color:var(--button-secondary-ripple);--text-color:var(--button-secondary-text)}.danger.svelte-k4pik7{--button-color:var(--button-danger);--fill-color:var(--button-danger);--ripple-color:var(--button-danger-ripple);--text-color:var(--button-danger-text)}.fill.svelte-k4pik7{--ripple-color:var(--button-filled-ripple);background-color:var(--fill-color);color:var(--text-color)}.outline.svelte-k4pik7{border:1px solid var(--button-color);color:var(--button-color)}";
    	append(document.head, style);
    }

    function create_fragment$7(ctx) {
    	let doric_button;
    	let t;
    	let ripple;
    	let doric_button_class_value;
    	let vars_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);
    	ripple = new Ripple({ props: { disabled: /*disabled*/ ctx[2] } });

    	return {
    		c() {
    			doric_button = element("doric-button");
    			if (default_slot) default_slot.c();
    			t = space();
    			create_component(ripple.$$.fragment);
    			set_custom_element_data(doric_button, "class", doric_button_class_value = "" + (/*color*/ ctx[0] + " " + /*variant*/ ctx[1] + " " + /*klass*/ ctx[5] + " svelte-k4pik7"));
    			toggle_class(doric_button, "disabled", /*disabled*/ ctx[2]);
    			toggle_class(doric_button, "round", /*round*/ ctx[3]);
    			toggle_class(doric_button, "fab", /*fab*/ ctx[4]);
    		},
    		m(target, anchor) {
    			insert(target, doric_button, anchor);

    			if (default_slot) {
    				default_slot.m(doric_button, null);
    			}

    			append(doric_button, t);
    			mount_component(ripple, doric_button, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(doric_button, "tap", /*handleTap*/ ctx[7]),
    					action_destroyer(vars_action = vars_1.call(null, doric_button, /*buttonVars*/ ctx[6]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 256)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			const ripple_changes = {};
    			if (dirty & /*disabled*/ 4) ripple_changes.disabled = /*disabled*/ ctx[2];
    			ripple.$set(ripple_changes);

    			if (!current || dirty & /*color, variant, klass*/ 35 && doric_button_class_value !== (doric_button_class_value = "" + (/*color*/ ctx[0] + " " + /*variant*/ ctx[1] + " " + /*klass*/ ctx[5] + " svelte-k4pik7"))) {
    				set_custom_element_data(doric_button, "class", doric_button_class_value);
    			}

    			if (vars_action && is_function(vars_action.update) && dirty & /*buttonVars*/ 64) vars_action.update.call(null, /*buttonVars*/ ctx[6]);

    			if (dirty & /*color, variant, klass, disabled*/ 39) {
    				toggle_class(doric_button, "disabled", /*disabled*/ ctx[2]);
    			}

    			if (dirty & /*color, variant, klass, round*/ 43) {
    				toggle_class(doric_button, "round", /*round*/ ctx[3]);
    			}

    			if (dirty & /*color, variant, klass, fab*/ 51) {
    				toggle_class(doric_button, "fab", /*fab*/ ctx[4]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(ripple.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			transition_out(ripple.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(doric_button);
    			if (default_slot) default_slot.d(detaching);
    			destroy_component(ripple);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let buttonVars;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { color = "default" } = $$props;
    	let { variant = "normal" } = $$props;
    	let { disabled = false } = $$props;
    	let { round } = $$props;
    	let { fab } = $$props;
    	let { class: klass = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	const handleTap = evt => {
    		if (disabled === true) {
    			return;
    		}

    		// Mobile browsers don't like dispatching events inside custom events
    		setTimeout(() => dispatch("tap", evt), 0);
    	};

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("variant" in $$props) $$invalidate(1, variant = $$props.variant);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    		if ("round" in $$props) $$invalidate(3, round = $$props.round);
    		if ("fab" in $$props) $$invalidate(4, fab = $$props.fab);
    		if ("class" in $$props) $$invalidate(5, klass = $$props.class);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*round*/ 8) {
    			 $$invalidate(6, buttonVars = { "button-round-size": round });
    		}
    	};

    	return [
    		color,
    		variant,
    		disabled,
    		round,
    		fab,
    		klass,
    		buttonVars,
    		handleTap,
    		$$scope,
    		slots
    	];
    }

    class Button extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-k4pik7-style")) add_css$5();

    		init(this, options, instance$6, create_fragment$7, safe_not_equal, {
    			color: 0,
    			variant: 1,
    			disabled: 2,
    			round: 3,
    			fab: 4,
    			class: 5
    		});
    	}
    }

    /* src\component\panel.svelte generated by Svelte v3.38.2 */

    function add_css$6() {
    	var style = element("style");
    	style.id = "svelte-1er4nwy-style";
    	style.textContent = "fieldset.svelte-1er4nwy{border:2px solid var(--primary);padding:4px;margin:0px;border-radius:4px}legend.svelte-1er4nwy:empty{display:none}legend.primary.svelte-1er4nwy{color:var(--primary)}legend.secondary.svelte-1er4nwy{color:var(--secondary)}legend.danger.svelte-1er4nwy{color:var(--danger)}";
    	append(document.head, style);
    }

    const get_title_slot_changes = dirty => ({});
    const get_title_slot_context = ctx => ({});

    function create_fragment$8(ctx) {
    	let fieldset;
    	let legend;
    	let legend_class_value;
    	let t;
    	let current;
    	const title_slot_template = /*#slots*/ ctx[2].title;
    	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[1], get_title_slot_context);
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	return {
    		c() {
    			fieldset = element("fieldset");
    			legend = element("legend");
    			if (title_slot) title_slot.c();
    			t = space();
    			if (default_slot) default_slot.c();
    			attr(legend, "class", legend_class_value = "" + (null_to_empty(/*color*/ ctx[0]) + " svelte-1er4nwy"));
    			attr(fieldset, "class", "svelte-1er4nwy");
    		},
    		m(target, anchor) {
    			insert(target, fieldset, anchor);
    			append(fieldset, legend);

    			if (title_slot) {
    				title_slot.m(legend, null);
    			}

    			append(fieldset, t);

    			if (default_slot) {
    				default_slot.m(fieldset, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (title_slot) {
    				if (title_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot(title_slot, title_slot_template, ctx, /*$$scope*/ ctx[1], dirty, get_title_slot_changes, get_title_slot_context);
    				}
    			}

    			if (!current || dirty & /*color*/ 1 && legend_class_value !== (legend_class_value = "" + (null_to_empty(/*color*/ ctx[0]) + " svelte-1er4nwy"))) {
    				attr(legend, "class", legend_class_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(title_slot, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(title_slot, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(fieldset);
    			if (title_slot) title_slot.d(detaching);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { color } = $$props;

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	return [color, $$scope, slots];
    }

    class Panel extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-1er4nwy-style")) add_css$6();
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, { color: 0 });
    	}
    }

    const kb = writable(null);
    const appTheme = writable(null);

    /* src\component\init-screen\menu.svelte generated by Svelte v3.38.2 */

    function add_css$7() {
    	var style = element("style");
    	style.id = "svelte-1h8hvcg-style";
    	style.textContent = "menu-item.svelte-1h8hvcg{display:block;padding:8px;cursor:pointer;border:1px solid transparent;user-select:none}menu-item.svelte-1h8hvcg:hover{border-color:var(--primary)}menu-item.selected.svelte-1h8hvcg::before{content:\">\";padding-right:8px}";
    	append(document.head, style);
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    const get_title_slot_changes$1 = dirty => ({});
    const get_title_slot_context$1 = ctx => ({});

    // (33:4) {#each items as option}
    function create_each_block$3(ctx) {
    	let menu_item;
    	let t0_value = /*option*/ ctx[6] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			menu_item = element("menu-item");
    			t0 = text(t0_value);
    			t1 = space();
    			set_custom_element_data(menu_item, "class", "svelte-1h8hvcg");
    			toggle_class(menu_item, "selected", /*match*/ ctx[2](/*option*/ ctx[6], /*value*/ ctx[0]));
    		},
    		m(target, anchor) {
    			insert(target, menu_item, anchor);
    			append(menu_item, t0);
    			append(menu_item, t1);

    			if (!mounted) {
    				dispose = listen(menu_item, "tap", function () {
    					if (is_function(/*set*/ ctx[3](/*option*/ ctx[6]))) /*set*/ ctx[3](/*option*/ ctx[6]).apply(this, arguments);
    				});

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*items*/ 2 && t0_value !== (t0_value = /*option*/ ctx[6] + "")) set_data(t0, t0_value);

    			if (dirty & /*match, items, value*/ 7) {
    				toggle_class(menu_item, "selected", /*match*/ ctx[2](/*option*/ ctx[6], /*value*/ ctx[0]));
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(menu_item);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (29:0) <Panel>
    function create_default_slot(ctx) {
    	let each_1_anchor;
    	let each_value = /*items*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*match, items, value, set*/ 15) {
    				each_value = /*items*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    // (30:4) <svelte:fragment slot="title">
    function create_title_slot(ctx) {
    	let current;
    	const title_slot_template = /*#slots*/ ctx[4].title;
    	const title_slot = create_slot(title_slot_template, ctx, /*$$scope*/ ctx[5], get_title_slot_context$1);

    	return {
    		c() {
    			if (title_slot) title_slot.c();
    		},
    		m(target, anchor) {
    			if (title_slot) {
    				title_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (title_slot) {
    				if (title_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot(title_slot, title_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_title_slot_changes$1, get_title_slot_context$1);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(title_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(title_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (title_slot) title_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$9(ctx) {
    	let panel;
    	let current;

    	panel = new Panel({
    			props: {
    				$$slots: {
    					title: [create_title_slot],
    					default: [create_default_slot]
    				},
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(panel.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(panel, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const panel_changes = {};

    			if (dirty & /*$$scope, items, value*/ 35) {
    				panel_changes.$$scope = { dirty, ctx };
    			}

    			panel.$set(panel_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(panel.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(panel.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(panel, detaching);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { items } = $$props;
    	let { value } = $$props;
    	const match = opt => opt === value;
    	const set = opt => () => $$invalidate(0, value = opt);

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	return [value, items, match, set, slots, $$scope];
    }

    class Menu extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-1h8hvcg-style")) add_css$7();
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, { items: 1, value: 0 });
    	}
    }

    /* src\component\init-screen.svelte generated by Svelte v3.38.2 */

    function add_css$8() {
    	var style = element("style");
    	style.id = "svelte-12z56c8-style";
    	style.textContent = "options-layout.svelte-12z56c8{display:grid;grid-template-columns:1fr 1fr;padding:4px;gap:4px}button-thing.svelte-12z56c8{display:grid;grid-column:span 2}";
    	append(document.head, style);
    }

    function get_then_context(ctx) {
    	ctx[7] = ctx[9][0];
    	ctx[8] = ctx[9][1];
    }

    // (1:0) <script>      import Button from "svelte-doric/core/button"        import bridge from "bridge"        import Panel from "./panel.svelte"      import {appTheme, kb}
    function create_catch_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (44:0) {:then [layouts, themes]}
    function create_then_block(ctx) {
    	get_then_context(ctx);
    	let options_layout;
    	let menu0;
    	let updating_value;
    	let t0;
    	let menu1;
    	let updating_value_1;
    	let t1;
    	let current;

    	function menu0_value_binding(value) {
    		/*menu0_value_binding*/ ctx[3](value);
    	}

    	let menu0_props = {
    		items: ["none", .../*themes*/ ctx[8]],
    		$$slots: { title: [create_title_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*theme*/ ctx[0] !== void 0) {
    		menu0_props.value = /*theme*/ ctx[0];
    	}

    	menu0 = new Menu({ props: menu0_props });
    	binding_callbacks.push(() => bind(menu0, "value", menu0_value_binding));

    	function menu1_value_binding(value) {
    		/*menu1_value_binding*/ ctx[4](value);
    	}

    	let menu1_props = {
    		items: /*layouts*/ ctx[7],
    		$$slots: { title: [create_title_slot$1] },
    		$$scope: { ctx }
    	};

    	if (/*layout*/ ctx[1] !== void 0) {
    		menu1_props.value = /*layout*/ ctx[1];
    	}

    	menu1 = new Menu({ props: menu1_props });
    	binding_callbacks.push(() => bind(menu1, "value", menu1_value_binding));
    	let if_block = /*layout*/ ctx[1] !== null && create_if_block(ctx);

    	return {
    		c() {
    			options_layout = element("options-layout");
    			create_component(menu0.$$.fragment);
    			t0 = space();
    			create_component(menu1.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			set_custom_element_data(options_layout, "class", "svelte-12z56c8");
    		},
    		m(target, anchor) {
    			insert(target, options_layout, anchor);
    			mount_component(menu0, options_layout, null);
    			append(options_layout, t0);
    			mount_component(menu1, options_layout, null);
    			append(options_layout, t1);
    			if (if_block) if_block.m(options_layout, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			get_then_context(ctx);
    			const menu0_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				menu0_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value && dirty & /*theme*/ 1) {
    				updating_value = true;
    				menu0_changes.value = /*theme*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			menu0.$set(menu0_changes);
    			const menu1_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				menu1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_value_1 && dirty & /*layout*/ 2) {
    				updating_value_1 = true;
    				menu1_changes.value = /*layout*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			menu1.$set(menu1_changes);

    			if (/*layout*/ ctx[1] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*layout*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(options_layout, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(menu0.$$.fragment, local);
    			transition_in(menu1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(menu0.$$.fragment, local);
    			transition_out(menu1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(options_layout);
    			destroy_component(menu0);
    			destroy_component(menu1);
    			if (if_block) if_block.d();
    		}
    	};
    }

    // (47:12) <svelte:fragment slot="title">
    function create_title_slot_1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Theme");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (53:12) <svelte:fragment slot="title">
    function create_title_slot$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Layout");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (58:8) {#if layout !== null}
    function create_if_block(ctx) {
    	let button_thing;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				color: "secondary",
    				variant: "outline",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	button.$on("tap", /*setup*/ ctx[2]);

    	return {
    		c() {
    			button_thing = element("button-thing");
    			create_component(button.$$.fragment);
    			set_custom_element_data(button_thing, "class", "svelte-12z56c8");
    		},
    		m(target, anchor) {
    			insert(target, button_thing, anchor);
    			mount_component(button, button_thing, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1024) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button_thing);
    			destroy_component(button);
    		}
    	};
    }

    // (60:16) <Button on:tap={setup} color="secondary" variant="outline">
    function create_default_slot$1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Load Keyboard");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (42:36)       <div>Loading</div>  {:then [layouts, themes]}
    function create_pending_block(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.textContent = "Loading";
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 9,
    		blocks: [,,,]
    	};

    	handle_promise(bridge__default['default'].loadDisplayOptions(), info);

    	return {
    		c() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m(target, anchor) {
    			insert(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $appTheme;
    	let $kb;
    	component_subscribe($$self, appTheme, $$value => $$invalidate(5, $appTheme = $$value));
    	component_subscribe($$self, kb, $$value => $$invalidate(6, $kb = $$value));
    	let theme = "none";
    	let layout = null;

    	const setup = async () => {
    		const kbInfo = await bridge__default['default'].loadKeyboardFile(layout);
    		const keys = await Promise.all(kbInfo.data["keyboard.groups"].map(name => bridge__default['default'].loadKeyFile(name)));

    		set_store_value(
    			appTheme,
    			$appTheme = theme === "none"
    			? null
    			: bridge__default['default'].resolve(args.themes, theme),
    			$appTheme
    		);

    		set_store_value(kb, $kb = keys, $kb);
    	};

    	function menu0_value_binding(value) {
    		theme = value;
    		$$invalidate(0, theme);
    	}

    	function menu1_value_binding(value) {
    		layout = value;
    		$$invalidate(1, layout);
    	}

    	return [theme, layout, setup, menu0_value_binding, menu1_value_binding];
    }

    class Init_screen extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-12z56c8-style")) add_css$8();
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, {});
    	}
    }

    /* src\component\css-import.svelte generated by Svelte v3.38.2 */

    function create_if_block$1(ctx) {
    	let html_tag;
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(/*importString*/ ctx[1], target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*importString*/ 2) html_tag.p(/*importString*/ ctx[1]);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    function create_fragment$b(ctx) {
    	let if_block_anchor;
    	let if_block = /*file*/ ctx[0] !== null && create_if_block$1(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (/*file*/ ctx[0] !== null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let formattedFileName;
    	let importString;
    	let { file } = $$props;

    	$$self.$$set = $$props => {
    		if ("file" in $$props) $$invalidate(0, file = $$props.file);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*file*/ 1) {
    			 $$invalidate(2, formattedFileName = file?.replace(/\\/g, "\\\\"));
    		}

    		if ($$self.$$.dirty & /*formattedFileName*/ 4) {
    			 $$invalidate(1, importString = `<style>@import "${formattedFileName}"</style>`);
    		}
    	};

    	return [file, importString, formattedFileName];
    }

    class Css_import extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, { file: 0 });
    	}
    }

    /* src\app.svelte generated by Svelte v3.38.2 */

    function add_css$9() {
    	var style = element("style");
    	style.id = "svelte-lp2lwc-style";
    	style.textContent = "body{overflow:hidden}app-layout.svelte-lp2lwc{display:inline-grid;grid-template-columns:min-content auto}keyboard-area.svelte-lp2lwc{display:block;opacity:0}.showKeyboard.svelte-lp2lwc{opacity:1}";
    	append(document.head, style);
    }

    // (57:0) {:else}
    function create_else_block(ctx) {
    	let app_layout;
    	let keyboard_area;
    	let keyboard;
    	let current;
    	keyboard = new Keyboard({ props: { blocks: /*$kb*/ ctx[3] } });

    	return {
    		c() {
    			app_layout = element("app-layout");
    			keyboard_area = element("keyboard-area");
    			create_component(keyboard.$$.fragment);
    			set_custom_element_data(keyboard_area, "class", "override svelte-lp2lwc");
    			toggle_class(keyboard_area, "showKeyboard", /*showKeyboard*/ ctx[1]);
    			set_custom_element_data(app_layout, "class", "svelte-lp2lwc");
    		},
    		m(target, anchor) {
    			insert(target, app_layout, anchor);
    			append(app_layout, keyboard_area);
    			mount_component(keyboard, keyboard_area, null);
    			/*app_layout_binding*/ ctx[5](app_layout);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const keyboard_changes = {};
    			if (dirty & /*$kb*/ 8) keyboard_changes.blocks = /*$kb*/ ctx[3];
    			keyboard.$set(keyboard_changes);

    			if (dirty & /*showKeyboard*/ 2) {
    				toggle_class(keyboard_area, "showKeyboard", /*showKeyboard*/ ctx[1]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(keyboard.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(keyboard.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(app_layout);
    			destroy_component(keyboard);
    			/*app_layout_binding*/ ctx[5](null);
    		}
    	};
    }

    // (55:0) {#if $kb === null}
    function create_if_block$2(ctx) {
    	let initscreen;
    	let current;
    	initscreen = new Init_screen({});

    	return {
    		c() {
    			create_component(initscreen.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(initscreen, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(initscreen.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(initscreen.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(initscreen, detaching);
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	let appstyle;
    	let t0;
    	let cssimport;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	appstyle = new App_style({ props: { baseline: Baseline, theme: Tron } });
    	cssimport = new Css_import({ props: { file: /*$appTheme*/ ctx[2] } });
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$kb*/ ctx[3] === null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			create_component(appstyle.$$.fragment);
    			t0 = space();
    			create_component(cssimport.$$.fragment);
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			mount_component(appstyle, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(cssimport, target, anchor);
    			insert(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(window, "toggle-visible", /*toggle_visible_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			const cssimport_changes = {};
    			if (dirty & /*$appTheme*/ 4) cssimport_changes.file = /*$appTheme*/ ctx[2];
    			cssimport.$set(cssimport_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(appstyle.$$.fragment, local);
    			transition_in(cssimport.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(appstyle.$$.fragment, local);
    			transition_out(cssimport.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(appstyle, detaching);
    			if (detaching) detach(t0);
    			destroy_component(cssimport, detaching);
    			if (detaching) detach(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $appTheme;
    	let $kb;
    	component_subscribe($$self, appTheme, $$value => $$invalidate(2, $appTheme = $$value));
    	component_subscribe($$self, kb, $$value => $$invalidate(3, $kb = $$value));
    	let layout = null;

    	const resize = elem => {
    		if (elem === null) {
    			return;
    		}

    		const box = elem.getBoundingClientRect();
    		bridge__default['default'].resizeWindow(box.width, box.height);
    	};

    	let showKeyboard = true;
    	const toggle_visible_handler = () => $$invalidate(1, showKeyboard = !showKeyboard);

    	function app_layout_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			layout = $$value;
    			$$invalidate(0, layout);
    		});
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*layout*/ 1) {
    			 resize(layout);
    		}
    	};

    	return [
    		layout,
    		showKeyboard,
    		$appTheme,
    		$kb,
    		toggle_visible_handler,
    		app_layout_binding
    	];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-lp2lwc-style")) add_css$9();
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, {});
    	}
    }

    //  electron 11.4.7

    const app = new App({
        target: document.body
    });

}(bridge));
