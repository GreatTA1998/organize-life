<script>
  import { templates, user } from '../../store'
  import Tasks from '../../back-end/Tasks'
  import text from './text'
  import GPT from '../../back-end/GPT.js'
  import { onMount, tick } from 'svelte'
  import { DateTime } from 'luxon'
  export let aiPanelWidth
  let TheChatInput
  let isThinking = false
  let lastMessage

  $: if (lastMessage) {
    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  const DefaultDateRange = {
    startDate: DateTime.now().minus({ month: 6 }).toISODate(),
    endDate: DateTime.now().plus({ month: 6 }).toISODate(),
  }

  let state = {
    userID: '',
    chat: [{ role: 'assistant', content: text.example }],
    currentInput: '',
    tasksJSON: '',
    templatesJSON: [],
    DateRange: DefaultDateRange,
  }

  const setState = newState => (state = newState)

  $: user.subscribe(value => {
    state = { ...state, userID: value.uid }
  })

  $: if (TheChatInput) {
    requestAnimationFrame(() => {
      TheChatInput.focus()
    })
  }

  onMount(async () => {
    const tasksJSON = await Tasks.getTasksJSONByRange(
      state.userID,
      state.DateRange.startDate,
      state.DateRange.endDate
    ).catch(err => {
      console.error('error in onMount, ', err)
    })
    const templatesJSON = JSON.stringify($templates)
    setState({ ...state, tasksJSON, templatesJSON })
    await tick()
  })

  async function addMessage() {
    isThinking = true
    if (state.currentInput.trim()) {
      setState({
        ...state,
        chat: [...state.chat, { role: 'user', content: state.currentInput }],
      })
    }
    state.currentInput = ''
    const { tasksJSON, templatesJSON, chat } = state
    setState({ ...state, chat: [...chat, { content: '<em>typing...</em>' }] })
    const { role, content } = await GPT.chat({ tasksJSON, templatesJSON, chat })
    setState({
      ...state,
      chat: [...state.chat.slice(0, -1), { role, content }],
    })
    isThinking = false
  }
</script>

<div
  class="container"
  style="max-width: {aiPanelWidth - 5}px; overflow-x: hidden;"
>
  <!-- <div class="profile-bubble" style="margin:auto; margin-top: 20px">
    <img style="width: 20px" src="/trueoutput-square-nobg.png" />
  </div> -->
  <div
    class="chat-box"
    style="display: flex; flex-direction: column; width: {aiPanelWidth - 10}px; margin-top: 20px;"
  >
    {#each state.chat as message, index (message)}
      {#if message.role === 'user'}
        <div class="user-message">{message.content}</div>
      {:else}
        <div class="assistant-message">
          <div
            class="{isThinking && index === state.chat.length - 1 ?
              'elementToFadeInAndOut'
            : ''} profile-bubble"
          >
            <!-- svelte-ignore a11y-missing-attribute -->
            <img style="width: 20px" src="/trueoutput-square-nobg.png" />
          </div>
          <div class="message-content">
            {@html message.content}
          </div>
        </div>
      {/if}
      {#if index === state.chat.length - 1}
        <div bind:this={lastMessage}></div>
      {/if}
    {/each}
  </div>

  <div class="input-section">
    <input
      bind:this={TheChatInput}
      type="text"
      placeholder="Type your message..."
      bind:value={state.currentInput}
      on:keydown={e => e.key === 'Enter' && addMessage()}
    />

    <button class="submit-button" on:click={addMessage}>
      <span class="material-symbols-outlined"> arrow_upward </span>
    </button>
  </div>
</div>

<style src="./AI.css"></style>
