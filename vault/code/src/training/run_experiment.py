"""Entry point gọi từ notebook Colab. Logic thật sống ở đây, không phải trong notebook."""
import yaml


def run_experiment(config_path: str):
    with open(config_path) as f:
        config = yaml.safe_load(f)

    # TODO: load model, apply LoRA, train, log metrics
    print(f"Running experiment with config: {config}")


if __name__ == "__main__":
    import sys
    run_experiment(sys.argv[1])
