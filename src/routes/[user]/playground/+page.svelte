<script>
  import ReusableTaskElement from "$lib/ReusableTaskElement.svelte";

  // Sample task data
  const sampleTask = {
    id: "test-task",
    name: "Test Task",
    description: "This is a test task",
    duration: 90
  };

  function handleDragStart(e) {
    e.dataTransfer.setData("text/plain", "test-data");
  }
</script>

<div class="test-container">
  <div class="example">
    <div class="dragdemo" draggable="true" on:dragstart={handleDragStart}>drag me</div>

  </div>

  <div class="example">
    <div 
      class="baseline-div" 
      draggable="true" 
      on:dragstart={handleDragStart}
    >
      Same parent baseline div
    </div>
  </div>

  <h3>1. Baseline Draggable Div</h3>
  <div 
    class="baseline-div" 
    draggable="true" 
    on:dragstart={handleDragStart}
  >
    Draggable Baseline Div
  </div>

  <h3>2. Regular Task (Not Positioned)</h3>
  <ReusableTaskElement
    task={sampleTask}
    pixelsPerHour={80}
    fontSize={0.8}
  />

  <h3>3. Absolutely Positioned Task</h3>
  <div class="absolute-container">
    <div class="absolute-task">
      <ReusableTaskElement
        task={sampleTask}
        pixelsPerHour={80}
        fontSize={0.8}
      />
    </div>
  </div>

  <h3>4. Absolutely Positioned in Scrolling Container</h3>
  <div class="scroll-container">
    <div class="scroll-content">
      <div class="absolute-task">
        <ReusableTaskElement
          task={sampleTask}
          pixelsPerHour={80}
          fontSize={0.8}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .example {
    border: 1px solid #ccc;
    background: #f7f6f5;
    border-radius: 8px;
    margin: 1em;
    padding: 2em;
    color: #333;
  }

  .test-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .dragdemo {
    width: 170px;
    height: 100px;
    line-height: 100px;
    text-align: center;
    border-radius: 6px;
    background: green;
    color: #efe;

    -webkit-user-drag: element;
    user-select: none;
  }

  .baseline-div {
    width: 200px;
    height: 80px;
    line-height: 80px;


    background: #e0e0e0;
    -webkit-user-drag: element;
    user-select: none;

    /* display: flex;
    align-items: center;
    justify-content: center;
    cursor: move; */
  }

  .absolute-container {
    position: relative;
    height: 100px;
    border: 1px dashed #ccc;
  }

  .absolute-task {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 200px;
  }

  .scroll-container {
    height: 200px;
    overflow-y: auto;
    border: 1px solid #ccc;
  }

  .scroll-content {
    position: relative;
    height: 400px;
  }
</style>