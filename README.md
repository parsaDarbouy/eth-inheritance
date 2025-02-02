# ETH Inheritance Smart Contract

This project implements an Ethereum smart contract that enables secure inheritance of ETH funds. The contract allows an owner to designate an heir who can claim ownership of the contract and its funds if the owner becomes inactive for more than 30 days.

## Key Features

- Owner can deposit and withdraw ETH
- Owner can designate and update heir
- Automatic inheritance after 30 days of owner inactivity
- Activity tracking through withdrawals and manual pings
- Security measures to prevent unauthorized inheritance claims

## Contract Functions

- `withdraw(uint256 amount)`: Owner can withdraw ETH from the contract. When amount=0, it only updates the last activity timestamp without performing any transfer
- `setHeir(address _newHeir)`: Owner can designate or update heir
- `claimInheritance()`: Heir can claim ownership after timelock expires

## Heir Designation

The contract uses a single `setHeir` function for all heir management:
- The owner can set/update the heir at any time
- After inheritance is claimed, the new owner can use the same `setHeir` function to designate their heir
- No special validation is required when setting a new heir after inheritance

## Development

This project uses Hardhat for development and testing. The following make commands are available:

```shell
# Show all available commands
make help

# Install dependencies
npm install

# Compile contracts
make compile

# Run tests
make test

# Deploy to network (default: localhost)
make deploy NETWORK=<network_name>

# Verify contract on Etherscan
make verify NETWORK=<network_name> CONTRACT_ADDRESS=<address> CONSTRUCTOR_ARGS=<args>

# Check test coverage
make coverage

# Run linter
make lint

# Format code
make format

# Start local node
make node
```

## Security Considerations

- The contract includes a 30-day timelock mechanism
- Zero-address checks for heir designation
- Proper access control using modifiers
- Events emitted for all important state changes

## Future Improvements

1. Add Emergency Functions
   - Implement emergency mode to pause contract operations
   - Add emergency withdrawal function bypassing timelock
   - Include emergency mode checks in existing functions
   - Add events for emergency actions
   - Add proper access controls for emergency functions

2. Add Multi-Signature Support
   - approveInheritanceClaim
