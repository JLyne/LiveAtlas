import {State} from "@/store";
import {DynmapPlayer, DynmapUrlConfig} from "@/dynmap";

declare module "*.png" {
   const value: any;
   export = value;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface LiveAtlasServerDefinition {
	id: string
	label?: string
}

interface LiveAtlasDynmapServerDefinition extends LiveAtlasServerDefinition {
	type: 'dynmap',
	dynmap: DynmapUrlConfig,
}

interface LiveAtlasMessageConfig {
	chatPlayerJoin: string;
	chatPlayerQuit: string;
	chatAnonymousJoin: string;
	chatAnonymousQuit: string;
	chatNoMessages: string;
	chatTitle: string;
	chatLogin: string;
	chatLoginLink: string;
	chatSend: string;
	chatPlaceholder: string;
	chatErrorNotAllowed: string;
	chatErrorRequiresLogin: string;
	chatErrorCooldown: string;
	chatErrorDisabled: string;
	chatErrorUnknown: string;
	serversHeading: string;
	worldsHeading: string;
	worldsSkeleton: string;
	playersSkeleton: string;
	playersHeading: string;
	playersTitle: string;
	playersTitleHidden: string;
	playersTitleOtherWorld: string;
	followingHeading: string;
	followingUnfollow: string;
	followingTitleUnfollow: string;
	followingHidden: string;
	linkTitle: string;
	loadingTitle: string;
	locationRegion: string;
	locationChunk: string;
	contextMenuCopyLink: string;
	contextMenuCenterHere: string;
	toggleTitle: string;
	mapTitle: string;
	layersTitle: string;
	copyToClipboardSuccess: string;
	copyToClipboardError: string;
}

export type LiveAtlasUIElement = 'layers' | 'chat' | 'players' | 'maps' | 'settings';
export type LiveAtlasSidebarSection = 'servers' | 'players' | 'maps';

interface LiveAtlasSortedPlayers extends Array<DynmapPlayer> {
	dirty?: boolean;
}
