// Model Types for Sign Language Recognition
export interface ModelMetadata {
  model_name: string;
  version: string;
  input_shape: number[];
  output_classes: string[];
  confidence_threshold: number;
  preprocessing: {
    normalize: boolean;
    scale_factor: number;
    input_range: number[];
    resize_to: number[];
    convert_to_rgb: boolean;
  };
  postprocessing: {
    apply_softmax: boolean;
    top_k: number;
  };
  model_info: {
    architecture: string;
    input_type: string;
    output_type: string;
    training_data: string;
    accuracy: string;
  };
}

export interface ModelPrediction {
  character: string;
  confidence: number;
  classIndex: number;
}

export interface ModelInput {
  imageData: Float32Array;
  width: number;
  height: number;
  channels: number;
}

export interface ModelOutput {
  predictions: ModelPrediction[];
  processingTime: number;
  timestamp: number;
}

export interface ModelConfig {
  inputSize: number;
  outputClasses: string[];
  confidenceThreshold: number;
  maxPredictions: number;
}

export interface ModelService {
  loadModel(): Promise<boolean>;
  predict(imageData: Float32Array): Promise<ModelOutput>;
  preprocessImage(imageData: Uint8Array, width: number, height: number): Promise<ModelInput>;
  postprocessPredictions(rawOutput: Float32Array): ModelPrediction[];
  isModelLoaded(): boolean;
  getModelInfo(): ModelMetadata | null;
}
