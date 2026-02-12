<script lang="ts">
	import { Download, Loader } from 'lucide-svelte';
	import sausage from '$lib/assets/sausage.png';
	import { fade } from 'svelte/transition';

	let url: string = '';
	let format: string = 'webm';
	let error: boolean = false;
	let downloading: boolean = false;

	let index = 0;
	const sites = [
		"youtube",
		"vimeo",
		"reddit",
		"twitter",
		"twitch",
	];
	const colors = [
		"text-red-500",
		"text-blue-600",
		"text-orange-600",
		"text-sky-400",
		"text-purple-900",
	];
	const adjust = [
		"left-0",
		"left-2.5",
		"left-2.5",
		"left-1",
		"left-1",
	];

	async function handleDownload() {
		console.log(`Downloading ${url} as ${format}...`);
		downloading = true;

		const res = await fetch('/api/download', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ url, format }),
		});

		if (!res.ok) {
			console.error("Invalid URL.");
			return;
		}

		const blob = await res.blob();
		const disposition = res.headers.get('Content-Disposition');
		const filename = disposition?.match(/filename="?(.+)"?/)?.[1] || 'download';
		
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
		downloading = false;
	}

	setInterval(() => {
		index = (index + 1) % sites.length;
	}, 2000);
</script>

<div class="flex flex-col items-center">
	<img class="w-50 p-5" src="{sausage}"/>
	<h1 class="text-xl">snag</h1>
	<form>
		<button type="submit" on:click={handleDownload}></button>
		<div class="text-slate-400 flex lg:w-200 w-90 h-13 relative">
			<input
				disabled={downloading}
				bind:value={url}
				type="text" 
				class="disabled:animate-pulse disabled:bg-emerald-950 relative w-full border-slate-800 bg-transparent rounded-full focus:ring-slate-600 focus:ring-2 active:outline-none transition"
				placeholder="enter a url and slap enter"
			/>
			<select bind:value={format} class="bg-transparent h-10 rounded-full focus:ring-0 border-slate-800 focus:border-slate-600 transition active:outline-none absolute right-1 top-1.5">
				<option value="webm">webm</option>
				<option value="aac">aac</option>
				<option value="mkv">mkv</option>
				<option value="mp4">mp4</option>
				<option value="mp3">mp3</option>
			</select>
		</div>
	</form>
	<div class="flex flex-col items-center jutify-center text-center p-10 text-lg">
		{#if downloading }
			<Loader class="motion-safe:animate-spin animate-pulse text-emerald-400" size={48} />
			<p class="m-10 animate-pulse">downloading your thingy, mate. give us a tick...</p>
		{:else}
			<p class="m-10">
				enter a 
				<span class="relative inline-block w-[7.5ch]">
				{#key index}
					<span in:fade={{ duration: 400 }} out:fade={{ duration: 100 }} class="{colors[index]} absolute inline-block text-lg top-0 {adjust[index]} translate-y-[-1.05em]">
						{sites[index]}
					</span>
				{/key}
				</span>
				URL and press enter to yoink it
			</p>
		{/if}
	</div>
</div>
