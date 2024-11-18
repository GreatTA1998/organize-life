<script>
  import { user } from '../../store'
  import Tasks from '../../back-end/Tasks'
  import text from './text'
  import GPT from '../../back-end/GPT.js'
  import { onMount, tick } from 'svelte'
  import { DateTime } from 'luxon'
  export let aiPanelWidth
  let TheChatInput

  const DefaultDateRange = {
    startDate: DateTime.now().minus({ month: 2 }).toISODate(),
    endDate: DateTime.now().plus({ month: 2 }).toISODate(),
  }

  let state = {
    userID: '',
    chat: [{ role: 'assistant', content: text.example }],
    currentInput: '',
    tasksJSON: '',
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
    setState({ ...state, tasksJSON })
    await tick()
  })

  async function addMessage() {
    if (state.currentInput.trim()) {
      setState({
        ...state,
        chat: [...state.chat, { role: 'user', content: state.currentInput }],
      })
    }
    state.currentInput = ''
    const { role, content } = await GPT.chat(state.tasksJSON, state.chat)
    console.log('content', content)
    setState({
      ...state,
      chat: [...state.chat, { role, content }],
    })
  }
</script>

<div
  class="container"
  style="max-width: {aiPanelWidth - 5}px; overflow-x: hidden;"
>
  <div
    class="chat-box"
    style="display: flex; flex-direction: column; width: {aiPanelWidth - 10}px;"
  >
    {#each state.chat as message}
      {#if message.role === 'user'}
        <div class="user-message">{message.content}</div>
      {:else}
        <div class="assistant-message">
          <div class="profile-bubble">
            <span class="material-symbols-outlined">smart_toy</span>
          </div>
          <div class="message-content">
            {@html message.content}
          </div>
        </div>
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
