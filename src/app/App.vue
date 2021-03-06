<template>
  <div id="app">
    <app-dialog
      :dialog-id="activeDialog"
      :type="dialogType"
      @dialog-ref="assignDialogRef" />

    <app-notifications
      class="notifications"
      :message="message" />

    <app-header
      :scroll-up="true"
      :transparent="transparent"
      :color="iconColor"
      :right-btn="rightBtn"
      :right-btn-on-click="rightBtnOnClick"
      :back-button="backBtn"
      :back-path="backBtnPath"
      :show-icon-backdrop="showIconBackdrop">
      <h1 v-if="!!pageTitle" slot="title">
        {{ pageTitle }}
      </h1>
    </app-header>

    <portal-dialog
      dialog-name="new-release-dialog"
      :show="showReleaseDialog"
      @close-dialog="emitCloseDialog">
      <span slot="headline">
        A new release has been downloaded!
        <span class="headline-emoji">( ˘ ³˘)♥</span>
      </span>

      <div>
        <p>
          Happy Plants {{ version }} introduces the following updates:
        </p>

        <md-changelog ref="releaseUpdates" />
      </div>
    </portal-dialog>

    <router-view />
  </div>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import Changelog from '#/CHANGELOG.md'
  import {
    getEntry as getSessionEntry,
    deleteEntry as deleteSessionEntry
  } from '@/api/sessionStorage'

  export default {
    name: 'HappyPlants',

    meta () {
      return {
        title: 'HappyPlants',
        htmlAttrs: {
          'data-theme': this.theme
        }
      }
    },

    components: {
      'md-changelog': Changelog
    },

    data () {
      return {
        applicationOnline: window && window.navigator && window.navigator.onLine,
        notificationTimeout: 2000,
        showReleaseDialog: false,
        dialog: null
      }
    },

    watch: {
      hasNewRelease (newRelease) {
        if (newRelease) {
          this.showReleaseDialog = true
        }
      },

      applicationOnline (online) {
        if (online === false && this.canSeeOfflineNotification) {
          this.showNotification({ message: 'You just went offline.' })
        }
      },

      activeDialog (dialogName) {
        if (dialogName) {
          this.$root.$el.parentNode.classList.add('js-no-scrolling')
          if (this.dialog) this.dialog.show()
        } else {
          this.$root.$el.parentNode.classList.remove('js-no-scrolling')
          if (this.dialog) this.dialog.hide()
        }
      }
    },

    computed: {
      ...mapState({
        version: state => state.version,
        hasNewRelease: state => state.hasNewRelease,
        activeDialog: state => state.dialog.active,
        dialogType: state => state.dialog.type,
        storageType: state => state.storage.type,
        authenticated: state => state.user.authenticated,
        theme: state => state.settings.theme,
        message: state => state.notification.message,
        pageTitle: state => state.appheader.title,
        transparent: state => state.appheader.transparent,
        iconColor: state => state.appheader.iconColor,
        backBtn: state => state.appheader.backBtn,
        backBtnPath: state => state.appheader.backBtnPath,
        rightBtn: state => state.appheader.rightBtn,
        rightBtnOnClick: state => state.appheader.rightBtnOnClick,
        showIconBackdrop: state => state.appheader.showIconBackdrop
      }),
      canSeeOfflineNotification () {
        return this.storageType === 'cloud'
      }
    },

    methods: {
      ...mapActions([
        'updateAuthMethod',
        'authRedirectResults',
        'authenticateUser',
        'loadVersion',
        'updateVersion',
        'loadSettings',
        'loadStorage',
        'updateStorage',
        'loadPlants',
        'loadTags',
        'showNotification',
        'hideNotification',
        'updateAppHeader',
        'toggleDialog'
      ]),
      assignDialogRef (dialog) {
        this.dialog = dialog
        if (this.dialog) this.dialog.on('hide', this.onDialogClose)
      },
      onDialogClose () {
        this.toggleDialog({ dialog: false })
      },
      emitCloseDialog () {
        this.showReleaseDialog = false
      },
      setApplicationOnline () {
        this.applicationOnline = true
      },
      setApplicationOffline () {
        this.applicationOnline = false
      }
    },

    async created () {
      await this.loadVersion()
      await this.updateVersion()
      await this.loadStorage()
      await this.updateStorage({ type: this.storageType })
      await this.loadSettings()

      if (getSessionEntry('USER_SIGNIN_PROGRESS')) {
        this.updateAuthMethod()

        if (this.$route.name === 'Intro' && this.storageType === 'local') {
          await this.updateStorage({ type: 'cloud' })
        }
        deleteSessionEntry('USER_SIGNIN_PROGRESS')

        try {
          await this.authRedirectResults()
        } catch (error) {
          this.showNotification()
        }
      // If not, we just want a regular authentication observer.
      } else if (this.storageType === 'cloud') {
        try {
          await this.authenticateUser()
        } catch (error) {
          this.$router.push('/intro')
        }
      }

      await this.loadPlants()
      await this.loadTags()

      if (this.theme === 'dark') {
        this.updateAppHeader({ iconColor: 'white' })
      }
    },

    mounted () {
      if (this.applicationOnline === false && this.canSeeOfflineNotification) {
        this.showNotification({ message: 'You are currently offline.' })
      }
      window.addEventListener('online', this.setApplicationOnline)
      window.addEventListener('offline', this.setApplicationOffline)
    },

    updated () {
      if (this.message) {
        setTimeout(this.hideNotification, this.notificationTimeout)
      }
    },

    beforeDestroy () {
      window.removeEventListener('online', this.setApplicationOnline)
      window.removeEventListener('offline', this.setApplicationOffline)
      if (this.dialog) this.dialog.off('hide', this.onDialogClose)
    }
  }
</script>

<style lang="postcss">
  @import "normalize.css";
  @import "../styles/colors";
  @import "../styles/animations";
  @import "../styles/media-queries";
  @import "../styles/fonts";
  @import "../styles/typography";
  @import "../styles/forms";
  @import "../styles/layout";

  * {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }

  body {
    display: flex;
    justify-content: center;
    background: var(--background-secondary);

    &.js-no-scrolling {
      overflow: hidden;
    }
  }

  #app {
    width: 100vw;
    min-height: 100vh;
    height: 100%;
  }

  #new-release-dialog {
    & .headline-emoji {
      font-family: monospace;
      font-size: var(--text-size-xsmall);
      letter-spacing: -4px;
      display: inline-block;
    }

    & .happy-dialog-content section h1,
    & .happy-dialog-content section h1 ~ p,
    & .happy-dialog-content section h2,
    & .happy-dialog-content section h2:nth-of-type(2n) ~ * {
      display: none;
    }

    & .happy-dialog-content section {
      margin-top: calc(var(--base-gap) / 2);
    }

    & .happy-dialog-content section ul {
      padding-left: var(--double-gap);
      margin-bottom: calc(var(--base-gap) / 2);
    }

    & .happy-dialog-content section p,
    & .happy-dialog-content section h3 {
      margin-bottom: calc(var(--base-gap) / 2);
    }
  }

  .notifications {
    z-index: 4;
  }

  .main-wireframe {
    display: flex;
    height: 100%;
    min-height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding-top: var(--app-header-size);
  }

  .app-content {
    width: 100%;
    max-width: var(--app-mobile-max-size);
    margin: 0 auto;

    @media (--max-mobile-viewport) {
      max-width: var(--app-desktop-max-width);
    }
  }

  .svg-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    color: inherit;
    vertical-align: middle;
  }
</style>
