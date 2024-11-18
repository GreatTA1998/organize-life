<script>
  import { templates, user } from '../../store'
  import Tasks from '../../back-end/Tasks'
  import text from './text'
  import GPT from '../../back-end/GPT.js'
  import { onMount, tick } from 'svelte'
  import { DateTime } from 'luxon'
  import { savedAIQuestions } from '../../store'
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

  let filteredSuggestions = []
  let selectedSuggestionIndex = -1
  $: filteredSuggestions =
    state.currentInput ?
      $savedAIQuestions.filter(q =>
        q.toLowerCase().includes(state.currentInput.toLowerCase())
      )
    : []

  function toggleSaveMessage(message) {
    const index = $savedAIQuestions.indexOf(message)
    if (index !== -1) {
      $savedAIQuestions = [
        ...$savedAIQuestions.slice(0, index),
        ...$savedAIQuestions.slice(index + 1),
      ]
    } else {
      $savedAIQuestions = [...$savedAIQuestions, message]
    }
  }

  function handleKeydown(event) {
    if (event.key === 'ArrowDown') {
      selectedSuggestionIndex =
        (selectedSuggestionIndex + 1) % filteredSuggestions.length
    } else if (event.key === 'ArrowUp') {
      selectedSuggestionIndex =
        (selectedSuggestionIndex - 1 + filteredSuggestions.length) %
        filteredSuggestions.length
    } else if (event.key === 'Enter' && selectedSuggestionIndex >= 0) {
      state.currentInput = filteredSuggestions[selectedSuggestionIndex]
      filteredSuggestions = [] // Clear suggestions after selection
      selectedSuggestionIndex = -1
    } else if (event.key === 'Enter') {
      addMessage()
    }
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
    style="display: flex; flex-direction: column; width: {aiPanelWidth -
      10}px; margin-top: 20px;"
  >
    {#each state.chat as message, index (message)}
      {#if message.role === 'user'}
        <div class="user-message">
          {message.content}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <span
            class="star-icon"
            on:click={() => toggleSaveMessage(message.content)}
          >
            {#if $savedAIQuestions.includes(message.content)}
              ★
            {:else}
              ☆
            {/if}
          </span>
        </div>
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

  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#if filteredSuggestions.length > 0}
    <div class="suggestions-list">
      {#each filteredSuggestions as suggestion, index}
        <div
          class:selected={index === selectedSuggestionIndex}
          on:click={() => {
            state.currentInput = suggestion
            filteredSuggestions = []
            selectedSuggestionIndex = -1
          }}
        >
          {suggestion}
        </div>
      {/each}
    </div>
  {/if}
  <div class="input-section">
    <input
      bind:this={TheChatInput}
      type="text"
      placeholder="Type your message..."
      bind:value={state.currentInput}
      on:keydown={handleKeydown}
    />

    <button class="submit-button" on:click={addMessage}>
      <span class="material-symbols-outlined"> arrow_upward </span>
    </button>
  </div>
</div>

<style src="./AI.css"></style>
