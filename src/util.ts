import {DynmapPlayer} from "@/dynmap";
import {useStore} from "@/store";

const headCache = new Map<DynmapPlayer, HTMLImageElement>();

export default {
	getMinecraftTime(serverTime: number) {
		const day = serverTime >= 0 && serverTime < 13700;

		return {
			serverTime: serverTime,
			days: Math.floor((serverTime + 8000) / 24000),

			// Assuming it is day at 6:00
			hours: (Math.floor(serverTime / 1000) + 6) % 24,
			minutes: Math.floor(((serverTime / 1000) % 1) * 60),
			seconds: Math.floor(((((serverTime / 1000) % 1) * 60) % 1) * 60),

			day: day,
			night: !day
		};
	},

	getMinecraftHead(player: DynmapPlayer, size: string): Promise<HTMLImageElement> {
		if(headCache.has(player)) {
			return Promise.resolve(headCache.get(player) as HTMLImageElement);
		}

		return new Promise((resolve, reject) => {
			const faceImage = new Image();

			faceImage.onload = function() {
				headCache.set(player, faceImage);
				resolve(faceImage);
			};

			faceImage.onerror = function() {
				console.error('Failed to retrieve face of "', player, '" with size "', size, '"!');
				reject();
			};

			const src = (size === 'body') ? `faces/body/${player.name}.png` :`faces/${size}x${size}/${player.name}.png`;
			faceImage.src = this.concatURL(window.config.url.markers, src);
		});
	},

	concatURL(base: string, addition: string) {
		if(base.indexOf('?') >= 0) {
			return base + escape(addition);
		}

		return base + addition;
	},

	getPointConverter() {
		const projection = useStore().state.currentProjection;

		return (x: number, y: number, z: number) => {
			return projection.locationToLatLng({x, y, z});
		};
	},

	parseMapHash(hash: string) {
		const parts = hash.replace('#', '').split(';');

		if(parts.length < 3) {
			throw new TypeError('Not enough parts');
		}

		const world = parts[0],
			map = parts[1],
			location = parts[2].split(',').map(item => parseFloat(item)),
			zoom = parts[3] ? parseInt(parts[3]) : undefined;

		if(location.length !== 3) {
			throw new TypeError('Location should contain exactly 3 numbers');
		}

		if(location.filter(item => isNaN(item) || !isFinite(item)).length) {
			throw new TypeError('Invalid value in location');
		}

		if(typeof zoom !== 'undefined' && (isNaN(zoom) || zoom < 0 || !isFinite(zoom))) {
			throw new TypeError('Invalid value for zoom');
		}

		return {
			world,
			map,
			location: {
				x: location[0],
				y: location[1],
				z: location[2],
			},
			zoom,
		}
	}
}