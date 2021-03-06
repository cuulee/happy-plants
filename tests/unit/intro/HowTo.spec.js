import { shallowMount, createLocalVue } from '@vue/test-utils'
import HowTo from '@/app/intro/components/HowTo'
import store from '@/store'
import router from '@/router'

const localVue = createLocalVue()

describe('app/settings/HowTo.vue', () => {
  const options = {
    localVue,
    store,
    router
  }

  it('is a Vue component', () => {
    const wrapper = shallowMount(HowTo, options)
    expect(wrapper.isVueInstance()).toEqual(true)
  })
})
