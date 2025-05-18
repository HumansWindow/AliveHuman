// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title SHAHICoinV1
 * @dev ERC20 Token for SHAHI Coin with additional features:
 * - Role-based access control
 * - Pausable transfers
 * - Merkle-proof based claims
 * - Authorized minters
 */
contract SHAHICoinV1 is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20BurnableUpgradeable, 
    PausableUpgradeable, 
    AccessControlUpgradeable 
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Merkle root for whitelist verification
    bytes32 public merkleRoot;
    
    // Mapping of addresses that have claimed tokens
    mapping(address => bool) public hasClaimed;
    
    // Mapping of authorized minters (for backend service)
    mapping(address => bool) public authorizedMinters;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializes the contract with name, symbol, initial supply and admin
     * @param initialSupply The initial token supply to mint
     * @param admin Address of the admin who will receive initial tokens and admin role
     */
    function initialize(uint256 initialSupply, address admin) public initializer {
        __ERC20_init("SHAHI Coin", "SHAHI");
        __ERC20Burnable_init();
        __Pausable_init();
        __AccessControl_init();
        
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ADMIN_ROLE, admin);
        _setupRole(PAUSER_ROLE, admin);
        _setupRole(MINTER_ROLE, admin);
        
        _mint(admin, initialSupply * 10 ** decimals());
    }
    
    /**
     * @dev Sets the merkle root for whitelist verification
     * @param _merkleRoot New merkle root
     */
    function setMerkleRoot(bytes32 _merkleRoot) public onlyRole(ADMIN_ROLE) {
        merkleRoot = _merkleRoot;
    }
    
    /**
     * @dev Adds or removes an address from authorized minters
     * @param minter Address to set permission for
     * @param authorized Whether the address is authorized
     */
    function setAuthorizedMinterRole(address minter, bool authorized) public onlyRole(ADMIN_ROLE) {
        authorizedMinters[minter] = authorized;
    }
    
    /**
     * @dev Pauses all token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Mints tokens to the specified address
     * @param to Recipient of the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()) || authorizedMinters[_msgSender()],
            "SHAHICoin: must have minter role or be authorized"
        );
        _mint(to, amount);
    }
    
    /**
     * @dev Allows a whitelisted user to claim tokens by providing a merkle proof
     * @param amount Amount of tokens to claim
     * @param merkleProof Merkle proof verifying the user is whitelisted
     */
    function claim(uint256 amount, bytes32[] calldata merkleProof) public {
        require(!hasClaimed[_msgSender()], "SHAHICoin: tokens already claimed");
        require(merkleRoot != bytes32(0), "SHAHICoin: merkle root not set");
        
        // Verify the merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(_msgSender(), amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "SHAHICoin: invalid merkle proof");
        
        // Mark as claimed and mint tokens
        hasClaimed[_msgSender()] = true;
        _mint(_msgSender(), amount);
    }
    
    /**
     * @dev Batch mint tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of token amounts
     */
    function batchMint(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) public {
        require(
            hasRole(MINTER_ROLE, _msgSender()) || authorizedMinters[_msgSender()],
            "SHAHICoin: must have minter role or be authorized"
        );
        require(recipients.length == amounts.length, "SHAHICoin: arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Hook that is called before any transfer of tokens. 
     * Implements token pause functionality.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}