//constants: 
const frame = document.getElementById('pp-frame');
const btn = document.getElementById('check-btn');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const step_label = document.getElementById("step-label");
const progress_fill = document.getElementById("progress-fill");
const instruction = document.getElementById('instruction');
const home_btn = document.getElementById('home-btn');
//master courses constant:
const COURSES = [
  {
    id: "01",
    title: "Basics-01",
    thumbnail: "images/thumbnail_01.png",
    creator: "Ritwik ",
    steps: [
      {
        id: "add_background",
        instruction: "Start with a background layer. Fill it with a color or pattern.",
        check: function (layers) {
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].name == "Background") return true;
          }
          return false;
        }
      },
      {
        id: "add_shape",
        instruction: "Draw a shape on a new layer above your background.",
        check: function (layers) {
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].name.startsWith("Shape") == true) return true;
          }
          return false;
        }
      },
      {
        id: "set_multiply",
        instruction: "Select your shape layer and set its blend mode to Multiply.",
        check: function (layers) {
          for (let i = 0; i < layers.length; i++) {
            if (layers[i].name.startsWith("Shape") && layers[i].blendMode == "mul ") return true;
          }
          return false;
        }
      }
    ]
  },
  {
    id: "02",
    title: "Basics-02",
    thumbnail: "images/thumbnail_02.png",
    creator: "Ritwik ",
    steps: []
  },
  {
    id: "03",
    title: "Weekend - After Hours",
    thumbnail: "images/thumbnail_03.jpg",
    creator: "Karthik ",
    steps: []
  }
]
const READ_STATE_SCRIPT = `
  (function() {
    if (!app.activeDocument) {
      app.echoToOE(JSON.stringify({ error: "no_document_open" }));
      return;
    }
    var doc = app.activeDocument;
    function describeLayer(l) {
      return {
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        blendMode: String(l.blendMode),
        kind: String(l.kind),
        selected: l.selected,
        bounds: l.bounds
      };
    }
    var layers = [];
    for (var i = 0; i < doc.layers.length; i++) {
      layers.push(describeLayer(doc.layers[i]));
    }
    var result = {
      docName: doc.name,
      width: doc.width,
      height: doc.height,
      layerCount: layers.length,
      layers: layers
    };
    app.echoToOE(JSON.stringify(result));
  })();
`;

//global variables: 
let ppReady = false;
let waitingForLayerData = false;
let currentStepIndex = 0;
let currentLessonIndex = 0;

//functions: 
function renderLessonGrid() {
  let grid = document.getElementById("lesson-grid");
  for (let i = 0; i < COURSES.length; i++) {
    let card = document.createElement("div");
    card.className = "lesson-card";
    card.innerHTML =
      "<img src='" + COURSES[i].thumbnail + "'>" +
      "<div class='label'>" +
      "<div class='lesson-number'>Lesson " + (i + 1) + "</div>" +
      "<div class='lesson-title'>" + COURSES[i].title + "</div>" +
      "<div class='lesson-creator'>" + COURSES[i].creator + "</div>" +
      "</div>";
    card.addEventListener("click", () => {
      currentLessonIndex = i;
      currentStepIndex = 0;
      document.getElementById("start-screen").style.display = "none";
      document.getElementById("app-view").style.display = "flex";
      updateInstruction(currentStepIndex);
      updateSidebar(currentStepIndex);
    });
    grid.appendChild(card);
  }
}

function updateSidebar(currentStepIndex) {
  if (COURSES[currentLessonIndex].steps.length >= currentStepIndex + 1) {
    step_label.textContent = "Step " + (currentStepIndex + 1) + " of " + COURSES[currentLessonIndex].steps.length;
  }
  progress_fill.style.width = (currentStepIndex / COURSES[currentLessonIndex].steps.length) * 100 + "%";
}

function updateInstruction(currentStepIndex) {
  instruction.textContent = COURSES[currentLessonIndex].steps[currentStepIndex].instruction;
}


//main execution:
renderLessonGrid();
window.addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow) return;

  const data = e.data;

  if (data === 'done') {
    if (!ppReady) {
      ppReady = true;
      btn.disabled = false;
      btn.textContent = 'Check Current Step';
      statusEl.textContent = 'Photopea is ready. Open/create a document, add a few layers, then click the button.';
    } else if (waitingForLayerData) {
      waitingForLayerData = false;
    }
    return;
  }

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      output.textContent = JSON.stringify(parsed, null, 2);

      if (parsed.layers && COURSES[currentLessonIndex].steps[currentStepIndex].check(parsed.layers) == true) {
        statusEl.textContent = "Correct! Moving to next step.";
        currentStepIndex++;
        if (currentStepIndex < COURSES[currentLessonIndex].steps.length) {
          updateInstruction(currentStepIndex);
          updateSidebar(currentStepIndex);
        } else {
          statusEl.textContent = "Lesson complete!";
          btn.textContent = "End";
          btn.style.backgroundColor = "gray";
          btn.disabled = true;
          updateSidebar(currentStepIndex);
        }
      } else {
        statusEl.textContent = "Not quite yet — keep trying.";
      }

    } catch (err) {
      output.textContent = 'Received non-JSON message: ' + data;
    }
    waitingForLayerData = false;
  }
});

btn.addEventListener('click', () => {
  if (!ppReady) return;
  waitingForLayerData = true;
  statusEl.textContent = 'Requesting current state...';
  frame.contentWindow.postMessage(READ_STATE_SCRIPT, '*');
});

home_btn.addEventListener('click', () => {
  document.getElementById("app-view").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
});

