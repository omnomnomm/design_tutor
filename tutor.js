const frame = document.getElementById('pp-frame');
const btn = document.getElementById('check-btn');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const step_label = document.getElementById("step-label");
const progress_fill = document.getElementById("progress-fill");
const instruction = document.getElementById('instruction');

const COURSE = [
  {
    id: "add_background",
    instruction: "Start with a background layer. Fill it with a color or pattern.",
    check: function(layers) {
      // TODO: return true if there's at least 1 layer
    }
  },
  {
    id: "add_shape",
    instruction: "Draw a shape on a new layer above your background.",
    check: function(layers) {
      // TODO: return true if any layer's name starts with "Shape"
    }
  },
  {
    id: "set_multiply",
    instruction: "Select your shape layer and set its blend mode to Multiply.",
    check: function(layers) {
      // TODO: return true if any layer whose name starts with "Shape" has blendMode === "multiply"
    }
  }
];

let currentStepIndex = 0;

function updateSidebar(currentStepIndex){
step_label.textContent = "Step " + (currentStepIndex + 1) + " of " + COURSE.length;
progress_fill.style.width = (currentStepIndex / COURSE.length) * 100 + "%";
}

function updateInstruction(currentStepIndex){
    instruction.textContent = COURSE[currentStepIndex].instruction;
}


let ppReady = false;
let waitingForLayerData = false;

// This is the script we send INTO Photopea. It walks the active document's
// layers and sends back a JSON description via echoToOE.
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

// Listen for messages coming FROM Photopea
window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;

    const data = e.data;

    if (data === 'done') {
        if (!ppReady) {
            ppReady = true;
            btn.disabled = false;
            btn.textContent = 'Check my current state';
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

            if (parsed.layers && COURSE[currentStepIndex].check(parsed.layers) == true) {
                statusEl.textContent = "Correct! Moving to next step.";
                currentStepIndex++;
                if (currentStepIndex < COURSE.length) {
                    updateInstruction(currentStepIndex);
                    updateSidebar(currentStepIndex);
                } else {
                    statusEl.textContent = "Lesson complete!";
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


