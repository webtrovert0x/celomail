// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DecentralizedMail {
    // Mapping from alias (string) to address
    mapping(string => address) public aliasToAddress;
    // Mapping from address to alias
    mapping(address => string) public addressToAlias;

    event AliasRegistered(address indexed user, string aliasName);
    event MessageSent(address indexed from, address indexed to, string contentCID, uint256 timestamp);

    // Register a unique alias (e.g., "alice")
    function registerAlias(string memory _alias) public {
        require(bytes(_alias).length > 0, "Alias cannot be empty");
        require(aliasToAddress[_alias] == address(0), "Alias already taken");
        require(bytes(addressToAlias[msg.sender]).length == 0, "Address already has an alias");

        aliasToAddress[_alias] = msg.sender;
        addressToAlias[msg.sender] = _alias;

        emit AliasRegistered(msg.sender, _alias);
    }

    // Send a message using the recipient's alias
    function sendMessage(string memory _toAlias, string memory _contentCID) public {
        address recipient = aliasToAddress[_toAlias];
        require(recipient != address(0), "Recipient alias does not exist");
        require(bytes(_contentCID).length > 0, "Message CID cannot be empty");

        emit MessageSent(msg.sender, recipient, _contentCID, block.timestamp);
    }

    // Get the alias of the caller
    function getMyAlias() public view returns (string memory) {
        return addressToAlias[msg.sender];
    }
}
