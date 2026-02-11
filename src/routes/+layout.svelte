<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import sausage from '$lib/assets/sausage.png';

	let { children } = $props();
</script>

<svelte:head><title>snag</title><link rel="icon" href={sausage} /></svelte:head>
{@render children()}
