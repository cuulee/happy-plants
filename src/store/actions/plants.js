import uuid from 'uuid/v4'
import loadImage from 'blueimp-load-image/js'
import { blobToBase64String } from 'blob-util'
import { convertToBlob } from '@/utils/blob'
import { iOS } from '@/utils/useragent'
import {
  fetchPlants,
  addPlant as addPlantFromAPI,
  deletePlants as deletePlantsFromAPI,
  updatePlant as updatePlantFromAPI
} from '@/api/plants'

function fixRotation (blob) {
  if (blob === undefined) return
  let parsed = blob

  loadImage(
    blob,
    canvas => {
      canvas.toBlob(ctb => {
        parsed = ctb
      })
    },
    { canvas: true, orientation: true }
  )

  return parsed
}

export const loadPlants = ({ state, commit }, data = {}) => {
  if (!state.plants || state.plants.length === 0 || !!data.force) {
    return fetchPlants()
      .then(data => Promise.all(data.map(convertToBlob))
        .then(plants => commit('LOAD_PLANTS', { plants })))
  }

  return Promise.resolve()
}

export const loadPlantItem = ({ state, commit }, guid) => {
  const item = state.plants.find(p => p.guid === guid)
  commit('LOAD_PLANT_ITEM', { item })
}

export const addPlant = ({ commit }, data) => {
  const meta = {
    ...data,
    blob: fixRotation(data.blob),
    guid: uuid(),
    created: Date.now(),
    modified: Date.now()
  }

  // FIXME: This is generally a bad idea. Use feature detection instead.
  // However, I could not find a reliable way to test if IndexedDB supports blobs,
  // as it fails silently. We have to convert the blob to base64,
  // because mobile Safari 10 has a bug with storing Blobs in IndexedDB.
  if (iOS && !!data.blob) {
    // 1. Turn blob into base64 string (only needed for storage)
    return blobToBase64String(data.blob)
      // 2. Take the base64 string and add it to the data object
      .then(base64String => Object.assign({}, meta, { blob: base64String }))
      // 3. Add data to IndexedDB and return it
      .then(config => addPlantFromAPI(config).then(() => config))
      // 4. Add the blob back to the object
      .then(config => Object.assign({}, config, { blob: data.blob }))
      // 5. Add new data to Vuex
      .then(data => {
        commit('ADD_PLANT', { item: data })
        return data.guid
      })
  }

  return addPlantFromAPI(meta)
    .then(data => {
      commit('ADD_PLANT', { item: meta })
      return data.guid
    })
}

export const deletePlants = ({ commit }, items) => {
  return deletePlantsFromAPI(items)
    .then(() => commit('DELETE_PLANTS', { items }))
}

export const updatePlant = ({ state, commit }, data) => {
  const item = state.plants.find(p => p.guid === data.guid)
  const config = { ...item, ...data, modified: Date.now() }
  return updatePlantFromAPI(config)
    .then(() => commit('UPDATE_PLANT', { config }))
}
