import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isBetween from 'dayjs/plugin/isBetween'
import { RadarVisibleControl } from './RadarVisibleControl'

dayjs.extend(utc)
dayjs.extend(isBetween)

export function useRadar() {
  /**
   * 現在時刻の少し前のレーダーのタイルURLを取得する関数
   */
  const fetchCurrentRadarTileUrl = () => {
    return fetchCurrentRadarTime().then(({ basetime, validtime }) => {
      return `https://www.jma.go.jp/bosai/jmatile/data/nowc/${basetime}/none/${validtime}/surf/hrpns/{z}/{x}/{y}.png`
    })
  }

  /**
   * 現在時刻の少し前の時刻のレーダー情報を取得する関数
   */
  const fetchCurrentRadarTime = () => {
    return fetch('https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json')
      .then((res) => res.json())
      .then((json) => {
        const now = dayjs()
        return json.find((data) => dayjs.utc(data.validtime).isBetween(now.subtract(10, 'minutes'), now))
      })
  }

  const getSource = async () => {
    const tileUrl = await fetchCurrentRadarTileUrl()
    return {
      type: 'raster',
      tiles: [tileUrl],
      maxzoom: 9,
      attribution:
        '<a href="https://www.jma.go.jp/bosai/nowc/" target="_blank">気象庁, Japan Meteorological Agency</a>',
    }
  }

  const getLayer = () => {
    return {
      type: 'raster',
      paint: {
        'raster-resampling': 'nearest',
        'raster-opacity': 0.4,
      },
    }
  }

  /**
   * add radar source and layer
   *
   * @async
   * @param {MapboxGL} map
   * @param {String} key
   * @param {String} beforeLayer
   */
  const setRadar = async (map, key = 'radar', beforeLayer = null) => {
    const source = await getSource()
    map.addSource(key, source)
    map.addLayer(
      {
        ...getLayer(),
        id: key,
        source: key,
      },
      beforeLayer
    )
    map.addControl(new RadarVisibleControl(key))
  }

  return {
    setRadar,
  }
}
