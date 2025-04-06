// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PackageVerification {
    struct PackageData {
        string senderID;
        string recipientID;
        string aidType;
        bytes32 hashData;
        uint256 timestamp;
    }

    mapping(bytes32 => PackageData) public packages;
    event PackageStored(bytes32 indexed hashData, string senderID, string recipientID, string aidType, uint256 timestamp);

    function storePackage(
        string memory senderID,
        string memory recipientID,
        string memory aidType,
        bytes32 hashData
    ) public {
        require(packages[hashData].hashData == 0, "Package already exists");

        packages[hashData] = PackageData({
            senderID: senderID,
            recipientID: recipientID,
            aidType: aidType,
            hashData: hashData,
            timestamp: block.timestamp
        });

        emit PackageStored(hashData, senderID, recipientID, aidType, block.timestamp);
    }

    function verifyPackage(bytes32 hashData) public view returns (bool) {
        return packages[hashData].timestamp != 0;
    }

    function getPackageInfo(bytes32 hashData) public view returns (string memory, string memory, string memory, uint256) {
        if (packages[hashData].hashData == 0) {
            return ("", "", "", 0); // Return empty values instead of reverting
        }
        return (
            packages[hashData].senderID,
            packages[hashData].recipientID,
            packages[hashData].aidType,
            packages[hashData].timestamp
        );
    }
}
