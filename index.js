var count, state;
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
	
	count = 0;
	state = "Down";

	// Test URL: https://teachablemachine.withgoogle.com/models/fSyvyhyFl/
	const URL = document.getElementById('modelURL').value.trim();
	const pattern = /^https:\/\/teachablemachine\.withgoogle\.com\/models\/[A-Za-z0-9_-]+\/$/;
	
	if (!URL) {
		alert('Please enter Teachable Machine model URL before starting the camera')
		return ;
	}
	
	else if (!pattern.test(URL)) {
		alert('Invalid URL. Please enter a valid Teachable Machine model URL.');
		return ;
	}

	const modelURL = URL + "model.json";
	const metadataURL = URL + "metadata.json";

	// load the model and metadata
	try {
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }
	catch (error) {
        alert('Failed to load the model. Please check the URL and try again.');
        console.error('Error loading the model:', error);
        return;
    }

	// Convenience function to setup a webcam
	const size = 400;
	const flip = true; // whether to flip the webcam
	webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
	await webcam.setup(); // request access to the webcam
	await webcam.play();
	window.requestAnimationFrame(loop);

	const canvas = document.getElementById("canvas");
	canvas.width = size; canvas.height = size;
	ctx = canvas.getContext("2d");
	labelContainer = document.getElementById("label-container");
	labelContainer.innerHTML = "";

}

async function loop() {
	webcam.update();
	await predict();
	window.requestAnimationFrame(loop);
}

async function predict() {
	
	const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
	const prediction = await model.predict(posenetOutput);

	let highestConfidence = 0;
	let highestClass = "";

	prediction.forEach(label => {
		if (label.probability > highestConfidence) {
            highestConfidence = label.probability;
            highestClass = label.className;
		}
	});

	if (highestConfidence > 0.9) {

		switch (highestClass) {
			
			case "Lift":
				
			case "Down":

				if (highestClass !== state) {
					count += 0.5;
					state = highestClass;
				}
				
				break;
				
			default:
				break;
		}

		labelContainer.innerHTML = `<h3>${Math.trunc(count)} (${state})</h3>`;

	}

	drawPose(pose);

}

function drawPose(pose) {
	if (webcam.canvas) {
		ctx.drawImage(webcam.canvas, 0, 0);
		if (pose) {
			const minPartConfidence = 0.4;
			tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
			tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
		}
	}
}

function stopCamera() {
	if (webcam) {
		webcam.stop();
	}
}
