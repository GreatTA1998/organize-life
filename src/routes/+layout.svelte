<script>
  import '/src/app.css'
  import { db } from '../back-end/firestoreConnection'
  import { page } from '$app/stores'
  import { user, hasLogoExited, calendarTasks, todoTasks } from '../store.js'
  import { goto } from '$app/navigation'
  import { getAuth, onAuthStateChanged } from 'firebase/auth'
  import { doc, setDoc, onSnapshot } from 'firebase/firestore'
  import { onDestroy, onMount } from 'svelte'
  import { updateFirestoreDoc } from '/src/helpers/firestoreHelpers.js'
  import posthog from 'posthog-js'
  let unsubUserSnapListener = null
  let doingAuth = true

  const hasConfirmedAuth = false

  $: visible = (doingAuth || loggedInButNoData)
  $: loggedInButNoData = ($user?.uid && (!$calendarTasks?.length || !$todoTasks?.length))
  
  onMount(() => {
    // fetching user takes around 300 - 500 ms
    onAuthStateChanged(getAuth(), async (resultUser) => {
      const onAuthStateChangedTime = performance.now();
      if (!resultUser) {
        user.set({})
        goto('/')

        // see how new visitors interacts with home page demos
        posthog.init('phc_Cm2c1eB0MCZLTjJDYHklZ7GUp0Ar7p5bIpF5hkCJPdo', {
          api_host: 'https://us.i.posthog.com',
          person_profiles: 'always' // or 'always' to create profiles for anonymous users as well
        })
      } else {
        // USER IS LOGGED INTO FIREBASE AUTH
        const urlParts = $page.url.pathname.split('/')

        // for a full path, urlParts is ['', 'PfxP5N71jQVzDejF9tYwTgrVtGz2', 'mobile']
        if (urlParts.length === 3 || urlParts[2] === 'mobile') {
          if (!isMobile()) {
            if (confirm('This is mobile mode. Use desktop mode instead?')) {
              goto('/' + resultUser.uid)
            }
          }
        }
        // desktop mode URL
        else {
          if (isMobile()) {
            if (confirm('This is desktop mode. Use mobile mode instead?')) {
              goto('/' + resultUser.uid + '/mobile')
            }
          } else {
            goto('/' + resultUser.uid)
          }
        }

        // partially hydrate the user so we can redirect away ASAP (NOTE: v1 this shouldn't make a lot of difference to load time)
        user.set({
          phoneNumber: resultUser.phoneNumber || '',
          uid: resultUser.uid
        })

        // handle the snapshot listener
        const ref = doc(db, '/users/' + resultUser.uid)
        unsubUserSnapListener = onSnapshot(ref, async (snap) => {
          if (!snap.exists()) {
            initializeNewFirestoreUser(ref, resultUser)
          } else {
            user.set({ ...snap.data() }) // augment with id, path, etc. when needed in the future
            guaranteeBackwardsCompatibility($user)
          }
        })
      }
      doingAuth = false
    })
  })

  // should be unnecessary because +layout getting destroyed means the App is closed
  onDestroy(() => {
    if (unsubUserSnapListener) unsubUserSnapListener()
  })

  function isMobile() {
    return window.innerWidth <= 768 // You can adjust the width threshold as needed
  }

  // NOTE: somewhat brittle code. If `.journal` is every empty temporariliy, for whatever reason, the entire journal will wipe.
  function guaranteeBackwardsCompatibility(userDoc) {
    const correctionObj = {}
    if (!userDoc.journal) correctionObj.journal = {}
    if (!userDoc.journalTitleFromMMDD) correctionObj.journalTitleFromMMDD = {}
    if (!userDoc.reusableTaskTemplates) correctionObj.reusableTaskTemplates = []

    updateFirestoreDoc(`/users/${userDoc.uid}`, correctionObj)
  }

  async function initializeNewFirestoreUser(ref, resultUser) {
    return await setDoc(
      ref,
      {
        uid: resultUser.uid,
        phoneNumber: resultUser.phoneNumber || '',
        email: resultUser.email || ''
        // allTasks: []
      },
      { merge: true }
    ).catch((err) => console.error('error in initializeNewFirestoreUser', err))
  }
</script>

<!-- <div
  id="loading-screen-logo-start"
  style="z-index: 99999; background: white; width: 100vw; height: 100vh"
  class="center"
>
  <img
    src="/trueoutput-square-nobg.png"
    class="app-loading-logo elementToFadeInAndOut center"
    alt="logo"
    style="width: 48px; height: 48px;"
  />
</div> -->

<div>
  <slot></slot>
</div>

<style>
  .invisible {
    visibility: hidden;
  }
  /* From Prabhakar's centering solution that works for iOS unlike StackOverflow
  https://github.com/project-feynman/v3/blob/d864f54d9a69e6cdf0beb7818e8b07a85cebb7eb/src/components/SeeExplanation.vue */
  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .elementToFadeInAndOut {
    animation: fadeInOut 1.4s ease-out 99 forwards;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  @media screen and (min-width: 320px) {
    .app-loading-logo {
      width: 110px;
      height: 110px;
      border-radius: 18px;
    }
  }
  @media screen and (min-width: 768px) {
    .app-loading-logo {
      width: 250px;
      height: 250px;
      border-radius: 40px;
    }
  }
</style>
