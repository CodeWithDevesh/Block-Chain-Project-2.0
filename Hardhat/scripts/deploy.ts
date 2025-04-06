import { ethers } from "hardhat";

async function main() {
    const PackageVerification = await ethers.getContractFactory("PackageVerification");
    const packageVerification = await PackageVerification.deploy();

    await packageVerification.waitForDeployment();
    console.log(`Contract deployed to: ${packageVerification.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
