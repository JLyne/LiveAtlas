<script lang="ts">
import {defineComponent} from "@vue/runtime-core";

export default defineComponent({
	props: {
		player: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
		}
	},

	mounted() {
		console.log('mounted ' + this.player.name);
	},

	unmounted() {
		console.log('unmounted '  + this.player.name);
	},

	render() {
		return null;
	}
})
</script>

<style scoped>

</style>