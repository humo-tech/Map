<script setup>
import { onMounted } from 'vue'
import { Ion, Viewer, SkyAtmosphere, Cesium3DTileset, CzmlDataSource, Cartesian3, Math as CesiumMath } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { CESIUM_ION_ACCESS_TOKEN } from '@/consts'

const baseUrl = import.meta.env.BASE_URL
// Grant CesiumJS access to your ion assets
Ion.defaultAccessToken = CESIUM_ION_ACCESS_TOKEN

let viewer
onMounted(async () => {
  viewer = new Viewer('map', {
    // terrain: Terrain.fromWorldTerrain(),
    // This is a global 3D Tiles tileset so disable the
    // globe to prevent it from interfering with the data
    globe: false,
    // Disabling the globe means we need to manually
    // re-enable the atmosphere
    skyAtmosphere: new SkyAtmosphere(),
    // 2D and Columbus View are not currently supported
    // for global 3D Tiles tilesets
    sceneModePicker: false,
    // Imagery layers are not currently supported for
    // global 3D Tiles tilesets
    baseLayerPicker: false,
    // shouldAnimate: true,
  })

  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(131.46779, 31.93186, 70),
    orientation: {
      heading: CesiumMath.toRadians(110.0),
      pitch: CesiumMath.toRadians(-15.0),
    },
  })

  // try {
  const tileset = await Cesium3DTileset.fromIonAssetId(2275207)
  viewer.scene.primitives.add(tileset)
  const dataSource = await viewer.dataSources.add(CzmlDataSource.load(`${baseUrl}/seagaia/swim.czml`))
  viewer.trackedEntity = dataSource.entities.getById('path')
  // } catch (error) {
  //  console.error(error)
  // }
})
</script>

<template>
  <div id="map" class="map"></div>
</template>

<style scoped>
.map {
  width: 100%;
  height: calc(100% - 80px);
  margin-top: 80px;
}
</style>
