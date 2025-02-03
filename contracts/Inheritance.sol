// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Inheritance
 * @dev Allows ETH inheritance if owner is inactive for more than 1 month
 */
contract Inheritance {
    address public owner;
    address public heir;
    uint256 public lastActivity;
    uint256 public constant INHERITANCE_TIMELOCK = 30 days;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event HeirUpdated(address indexed previousHeir, address indexed newHeir);
    event Withdrawal(address indexed recipient, uint256 amount);
    event ActivityUpdated(uint256 timestamp);
    event TimelockUpdated(uint256 oldTimelock, uint256 newTimelock);

    // Custom Errors
    error NotOwner();
    error NotHeir();
    error TimelockNotExpired();
    error InvalidHeirAddress();
    error InsufficientBalance();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyHeir() {
        if (msg.sender != heir) revert NotHeir();
        _;
    }

    modifier canInherit() {
        if (msg.sender != heir) revert NotHeir();
        if (block.timestamp < lastActivity + INHERITANCE_TIMELOCK)
            revert TimelockNotExpired();
        _;
    }

    constructor(address _heir) {
        if (_heir == address(0)) revert InvalidHeirAddress();
        owner = msg.sender;
        heir = _heir;
        lastActivity = block.timestamp;
    }

    /**
     * @dev Allows owner to withdraw ETH from the contract or reset the activity timer
     * @param amount Amount of ETH to withdraw (can be 0 to just reset timer)
     */
    function withdraw(uint256 amount) external onlyOwner {
        if (amount > address(this).balance) revert InsufficientBalance();

        // Update state before external call
        updateActivity();

        if (amount > 0) {
            // Emit event before external call to prevent reentrancy concerns
            emit Withdrawal(owner, amount);

            (bool success, ) = payable(owner).call{value: amount}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @dev Updates the last activity timestamp
     */
    function updateActivity() private {
        lastActivity = block.timestamp;
        emit ActivityUpdated(lastActivity);
    }

    /**
     * @dev Allows owner to designate a new heir
     * @param _newHeir Address of the new heir
     */
    function setHeir(address _newHeir) external onlyOwner {
        if (_newHeir == address(0)) revert InvalidHeirAddress();
        emit HeirUpdated(heir, _newHeir);
        heir = _newHeir;
        updateActivity();
    }

    /**
     * @dev Allows heir to claim ownership after timelock expires
     */
    function claimInheritance() external canInherit {
        address previousOwner = owner;
        owner = heir;
        heir = address(0); // Reset heir after inheritance
        updateActivity();
        emit OwnershipTransferred(previousOwner, owner);
    }

    receive() external payable {}
}
