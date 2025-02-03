# Variables
NETWORK ?= localhost
ETHERSCAN_API_KEY ?= your_etherscan_api_key

# Colors for terminal output
YELLOW := \033[0;33m
NC := \033[0m # No Color

.PHONY: all clean compile test deploy coverage lint help

# Default target
all: clean compile test

# Help command to show available commands
help:
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo "  make compile      - Compile smart contracts"
	@echo "  make test      	 - Run tests"
	@echo "  make clean      	 - Remove build artifacts"
	@echo "  make deploy    	 - Deploy contracts to network (NETWORK=network_name)"
	@echo "  make coverage  	 - Run test coverage"
	@echo "  make lint         - Run slither and eslint linter"
	@echo "  make format       - Format code with prettier"
	@echo "  make node         - Start local hardhat node"

# Compile contracts
compile:
	@echo "$(YELLOW)Compiling contracts...$(NC)"
	npx hardhat compile

# Run tests
test:
	@echo "$(YELLOW)Running tests...$(NC)"
	npx hardhat test

# Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	npx hardhat clean
	rm -rf cache artifacts

# Deploy contracts
deploy:
	@echo "$(YELLOW)Deploying to $(NETWORK)...$(NC)"
	npx hardhat run scripts/deploy.js --network $(NETWORK)

# Run test coverage
coverage:
	@echo "$(YELLOW)Running test coverage...$(NC)"
	npx hardhat coverage

# Format code
format:
	@echo "$(YELLOW)Formatting code...$(NC)"
	npx prettier --write \
		'contracts/**/*.sol' \
		'test/**/*.js' \
		'scripts/**/*.js' \
		--plugin=prettier-plugin-solidity

# Node task to run local network
node:
	@echo "$(YELLOW)Starting local hardhat node...$(NC)"
	npx hardhat node

slither:
	@echo "$(YELLOW)Running slither...$(NC)"
	slither . --exclude naming-convention,external-function,solc-version,low-level-calls

eslint:
	@echo "$(YELLOW)Running eslint...$(NC)"
	npm run lint:fix

# Run lints
lint: slither eslint

