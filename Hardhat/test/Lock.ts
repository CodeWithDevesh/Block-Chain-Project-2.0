import { expect } from "chai";
import { ethers } from "hardhat";
import { PackageVerification } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PackageVerification", function () {
  let packageVerification: PackageVerification;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  const createPackageHash = (content: string): string => {
    return ethers.keccak256(ethers.toUtf8Bytes(content));
  };

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const PackageVerification = await ethers.getContractFactory("PackageVerification");
    packageVerification = await PackageVerification.deploy();
    await packageVerification.waitForDeployment();
  });

  describe("Package Storage", function () {
    it("Should store a new package successfully", async function () {
      const senderID = "Sender123";
      const recipientID = "Recipient456";
      const aidType = "Food";
      const packageHash = createPackageHash("Package 1");

      await packageVerification.storePackage(senderID, recipientID, aidType, packageHash);

      const isVerified = await packageVerification.verifyPackage(packageHash);
      expect(isVerified).to.be.true;
    });

    it("Should fail when storing duplicate package", async function () {
      const senderID = "Sender123";
      const recipientID = "Recipient456";
      const aidType = "Food";
      const packageHash = createPackageHash("Package 1");

      await packageVerification.storePackage(senderID, recipientID, aidType, packageHash);

      await expect(
        packageVerification.storePackage(senderID, recipientID, aidType, packageHash)
      ).to.be.revertedWith("Package already exists");
    });

    it("Should allow different users to store different packages", async function () {
      const packageHash1 = createPackageHash("Package 1");
      const packageHash2 = createPackageHash("Package 2");

      await packageVerification.connect(owner).storePackage("Sender1", "Recipient1", "Medical", packageHash1);
      await packageVerification.connect(addr1).storePackage("Sender2", "Recipient2", "Water", packageHash2);

      expect(await packageVerification.verifyPackage(packageHash1)).to.be.true;
      expect(await packageVerification.verifyPackage(packageHash2)).to.be.true;
    });
  });

  describe("Package Verification", function () {
    it("Should return false for non-existent package", async function () {
      const nonExistentHash = createPackageHash("Non-existent Package");
      const isVerified = await packageVerification.verifyPackage(nonExistentHash);
      expect(isVerified).to.be.false;
    });

    it("Should verify existing package", async function () {
      const senderID = "Sender123";
      const recipientID = "Recipient456";
      const aidType = "Food";
      const packageHash = createPackageHash("Package 1");

      await packageVerification.storePackage(senderID, recipientID, aidType, packageHash);
      const isVerified = await packageVerification.verifyPackage(packageHash);
      expect(isVerified).to.be.true;
    });
  });

  describe("Package Info Retrieval", function () {
    it("Should retrieve correct package info", async function () {
      const senderID = "Sender123";
      const recipientID = "Recipient456";
      const aidType = "Food";
      const packageHash = createPackageHash("Package 1");

      await packageVerification.storePackage(senderID, recipientID, aidType, packageHash);

      const [retrievedSenderID, retrievedRecipientID, retrievedAidType, retrievedTimestamp] =
        await packageVerification.getPackageInfo(packageHash);

      expect(retrievedSenderID).to.equal(senderID);
      expect(retrievedRecipientID).to.equal(recipientID);
      expect(retrievedAidType).to.equal(aidType);
      expect(Number(retrievedTimestamp)).to.be.gt(0);
    });

    it("Should return empty values for non-existent package", async function () {
      const nonExistentHash = createPackageHash("Non-existent Package");
      const [retrievedSenderID, retrievedRecipientID, retrievedAidType, retrievedTimestamp] =
        await packageVerification.getPackageInfo(nonExistentHash);

      expect(retrievedSenderID).to.equal("");
      expect(retrievedRecipientID).to.equal("");
      expect(retrievedAidType).to.equal("");
      expect(retrievedTimestamp).to.equal(0);
    });
  });
});
