<script setup>
import { onMounted, ref, computed } from 'vue'
import {
  Ion,
  Viewer,
  SkyAtmosphere,
  Cesium3DTileset,
  CzmlDataSource,
  Cartesian3,
  Math as CesiumMath,
  JulianDate,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { CESIUM_ION_ACCESS_TOKEN } from '@/consts'

const stages = ['swim', 'swim_bike', 'bike', 'run']
const stageCount = ref(0)
let loading = false
const stage = computed(() => {
  return (stages?.[stageCount.value - 1] || '').toUpperCase()
})

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

  viewer.scene.camera.setView({
    destination: Cartesian3.fromDegrees(131.46779, 31.93186, 70),
    orientation: {
      heading: CesiumMath.toRadians(110.0),
      pitch: CesiumMath.toRadians(-15.0),
    },
  })

  const tileset = await Cesium3DTileset.fromIonAssetId(2275207)
  viewer.scene.primitives.add(tileset)
  // const dataSource = await viewer.dataSources.add(CzmlDataSource.load(`${baseUrl}/seagaia/${stages[stageCount]}.czml`))
  // viewer.trackedEntity = dataSource.entities.getById('path')

  setTimeout(setRoute, 5000)
})

const setRoute = () => {
  viewer.clock.onTick.addEventListener(async (clock) => {
    const timeRemain = JulianDate.secondsDifference(clock.stopTime, clock.currentTime)
    if ((timeRemain < 5 || stageCount.value === 0) && !loading && stageCount.value < stages.length) {
      viewer.clock.shouldAnimate = false
      loading = true
      const dataSource = await viewer.dataSources.add(
        CzmlDataSource.load(`${baseUrl}/seagaia/${stages[stageCount.value]}.czml`)
      )
      viewer.trackedEntity = dataSource.entities.getById('path')
      viewer.clock.multiplier = 100
      viewer.clock.shouldAnimate = true
      loading = false
      stageCount.value++
    }
  })
}
</script>

<template>
  <h1>
    MIYAZAKI SEA GAIA TRIATHRON <span v-show="stage">({{ stage }})</span>
  </h1>
  <div id="map" class="map"></div>
</template>

<style scoped>
h1 {
  font-size: 32px;
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 10;
  margin: 0;
  padding: 10px 20px;
  background-color: #c90505cc;
  color: #fff;
  font-family: Sans-Serif;
  font-style: italic;
  border-radius: 7px;
  transform: skewX(-10deg);
}
@media (max-width: 720px) {
  h1 {
    display: block;
    max-width: 90%;
    font-size: 14px;
    border-radius: 3px;
    padding: 5px 10px;
    font-style: none;
    top: 48px;
    left: 10px;
    transform: skewX(0deg);
  }
}
.map {
  width: 100%;
  height: 100%;
}
</style>
