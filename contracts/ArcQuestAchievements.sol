// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ArcQuestAchievements
/// @notice Testnet ERC-721 achievements for ArcQuest learning missions.
contract ArcQuestAchievements {
    string public constant name = "ArcQuest Achievements";
    string public constant symbol = "ARCQ";

    struct Achievement {
        uint8 levelId;
        uint16 score;
        uint64 mintedAt;
        address player;
        string nickname;
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint8 => bool)) public mintedLevel;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event AchievementMinted(
        address indexed player,
        uint256 indexed tokenId,
        uint8 indexed levelId,
        uint16 score,
        string nickname
    );

    error InvalidLevel();
    error InvalidScore();
    error InvalidNickname();
    error AlreadyMinted();
    error NotTokenOwner();
    error TokenDoesNotExist();
    error NotApproved();
    error ZeroAddress();

    /// @notice Standard ABI entrypoint for contract explorers and scripts.
    function mintAchievement(uint8 levelId, uint16 score, string calldata nickname) external returns (uint256 tokenId) {
        return _mintAchievement(msg.sender, levelId, score, nickname);
    }

    /// @notice Compact entrypoint used by the dependency-free browser frontend.
    /// @dev calldata format: 0x01 || uint8 levelId || uint16 score big-endian || nickname bytes.
    fallback() external {
        bytes calldata data = msg.data;
        if (data.length < 4 || data[0] != bytes1(0x01)) revert InvalidNickname();

        uint8 levelId = uint8(data[1]);
        uint16 score = (uint16(uint8(data[2])) << 8) | uint16(uint8(data[3]));
        bytes memory nicknameBytes = new bytes(data.length - 4);
        for (uint256 index = 4; index < data.length; index++) {
            nicknameBytes[index - 4] = data[index];
        }
        string memory nickname = string(nicknameBytes);

        _mintAchievement(msg.sender, levelId, score, nickname);
    }

    function _mintAchievement(
        address player,
        uint8 levelId,
        uint16 score,
        string memory nickname
    ) private returns (uint256 tokenId) {
        if (levelId == 0 || levelId > 6) revert InvalidLevel();
        if (score == 0 || score > 500) revert InvalidScore();
        if (!_validNickname(nickname)) revert InvalidNickname();
        if (mintedLevel[player][levelId]) revert AlreadyMinted();

        tokenId = nextTokenId++;
        mintedLevel[player][levelId] = true;
        achievements[tokenId] = Achievement({
            levelId: levelId,
            score: score,
            mintedAt: uint64(block.timestamp),
            player: player,
            nickname: nickname
        });

        _owners[tokenId] = player;
        _balances[player] += 1;

        emit Transfer(address(0), player, tokenId);
        emit AchievementMinted(player, tokenId, levelId, score, nickname);
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) revert ZeroAddress();
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) revert TokenDoesNotExist();
        return owner;
    }

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender)) revert NotApproved();
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        ownerOf(tokenId);
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (to == address(0)) revert ZeroAddress();
        address owner = ownerOf(tokenId);
        if (owner != from) revert NotTokenOwner();
        if (msg.sender != owner && getApproved(tokenId) != msg.sender && !isApprovedForAll(owner, msg.sender)) {
            revert NotApproved();
        }

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata) external {
        transferFrom(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f;
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        Achievement memory achievement = achievements[tokenId];
        string memory image = Base64.encode(bytes(_svg(tokenId, achievement)));
        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name":"ArcQuest - ',
                    _levelName(achievement.levelId),
                    '","description":"Fan-made ArcQuest achievement NFT minted on Arc testnet.","image":"data:image/svg+xml;base64,',
                    image,
                    '","attributes":[',
                    '{"trait_type":"Game","value":"ArcQuest"},',
                    '{"trait_type":"Level","value":"',
                    _levelName(achievement.levelId),
                    '"},',
                    '{"trait_type":"Score","value":',
                    _toString(achievement.score),
                    "},",
                    '{"trait_type":"Nickname","value":"',
                    achievement.nickname,
                    '"}',
                    "]}"
                )
            )
        );
        return string.concat("data:application/json;base64,", json);
    }

    function _svg(uint256 tokenId, Achievement memory achievement) private pure returns (string memory) {
        string memory shortAddress = _shortAddress(achievement.player);
        return string.concat(
            "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630' viewBox='0 0 1200 630'>",
            "<defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#00002c'/><stop offset='1' stop-color='#001d77'/></linearGradient>",
            "<linearGradient id='soft' x1='0' y1='0' x2='0' y2='1'><stop stop-color='#ffffff' stop-opacity='.92'/><stop offset='1' stop-color='#ffffff' stop-opacity='.42'/></linearGradient></defs>",
            "<rect width='1200' height='630' fill='url(#bg)'/>",
            "<circle cx='1010' cy='120' r='440' fill='#3d6fff' opacity='.16'/>",
            "<path d='M160 -170 A740 740 0 0 0 1030 475' fill='none' stroke='#fff' stroke-opacity='.28' stroke-width='2'/>",
            "<path d='M220 -80 V420 L650 650' fill='none' stroke='#fff' stroke-opacity='.28' stroke-width='2'/>",
            "<g transform='translate(72 62) scale(1.55)'>",
            "<path d='M23.8574 0C31.0115 0 37.371 6.19775 41.7656 17.4521C44.0513 23.3056 45.7332 30.2603 46.7295 37.8262C46.8186 38.5019 46.8939 39.1888 46.9717 39.874C46.9969 39.9162 47.0119 39.9553 47.0068 39.9873C47.0068 39.9873 47.5924 43.6447 47.7168 50H47.6514C46.7829 49.2873 36.54 41.2389 19.5615 43.5693C19.8177 40.6962 20.1699 37.9004 20.625 35.2207C20.6482 35.0838 20.6755 34.9514 20.6992 34.8154C27.3585 34.6146 33.1876 35.3879 37.6572 36.4014C37.6406 36.2954 37.6263 36.1865 37.6094 36.0811C36.6906 30.3599 35.3355 25.1217 33.5879 20.6455C30.7304 13.3264 27.001 8.77832 23.8574 8.77832C20.7141 8.77863 16.9853 13.3266 14.1279 20.6455C13.4363 22.4157 12.8068 24.3036 12.2422 26.2949C11.4483 29.0854 10.7807 32.0773 10.248 35.2207C9.45968 39.8629 8.96755 44.8418 8.78613 50H0C0.405408 37.7593 2.48104 26.3352 5.9502 17.4521C10.3437 6.19798 16.7036 0.000184295 23.8574 0ZM131.198 16.6523C134.06 16.6524 136.482 17.1955 138.466 18.2783C140.448 19.3622 142.002 20.7725 143.127 22.5098C144.251 24.2481 144.957 26.0777 145.243 27.999L141.624 28.7354C141.419 27.1408 140.908 25.6789 140.091 24.3496C139.272 23.0217 138.128 21.9584 136.656 21.1611C135.184 20.3638 133.365 19.9649 131.198 19.9648C129.031 19.9648 127.088 20.4664 125.371 21.4678C123.654 22.4702 122.294 23.8806 121.293 25.6992C120.291 27.5192 119.79 29.6764 119.79 32.1699V32.6602C119.79 35.1546 120.291 37.312 121.293 39.1309C122.295 40.9507 123.654 42.3619 125.371 43.3633C127.088 44.3657 129.031 44.8662 131.198 44.8662C134.469 44.8662 136.963 44.0174 138.681 42.3203C140.398 40.624 141.461 38.5481 141.87 36.0947L145.488 36.8311C145.12 38.7534 144.354 40.5828 143.188 42.3203C142.023 44.0587 140.448 45.4699 138.466 46.5527C136.482 47.6355 134.06 48.1777 131.198 48.1777C128.295 48.1777 125.709 47.5534 123.439 46.3066C121.17 45.0599 119.381 43.2709 118.073 40.9404C116.764 38.6097 116.11 35.8707 116.11 32.7217V32.1084C116.11 28.9191 116.764 26.1698 118.073 23.8594C119.381 21.5499 121.17 19.7711 123.439 18.5234C125.709 17.2767 128.295 16.6523 131.198 16.6523ZM97.2402 47.3193H93.1309L89.4512 35.9111H69.9473L66.2666 47.3193H62.1582L76.2031 4.38672H83.1943L97.2402 47.3193ZM116.065 20.8232H112.14C109.89 20.8233 108.091 21.4578 106.742 22.7246C105.393 23.9925 104.719 25.9754 104.719 28.6738V47.3193H101.038V17.5117H104.596V21.2529H105.332C105.904 19.9035 106.752 18.9219 107.877 18.3086C109.001 17.6953 110.566 17.3887 112.569 17.3887H116.065V20.8232ZM71.0508 32.3545H88.3467L80.0664 6.7168H79.3311L71.0508 32.3545Z' fill='url(#soft)'/>",
            "</g>",
            "<text x='72' y='185' fill='#8bb2ff' font-family='Arial, sans-serif' font-size='22' font-weight='700' letter-spacing='4'>ARCQUEST ACHIEVEMENT</text>",
            "<text x='72' y='275' fill='white' font-family='Arial, sans-serif' font-size='68' font-weight='800'>",
            _levelName(achievement.levelId),
            "</text>",
            "<text x='72' y='342' fill='white' fill-opacity='.82' font-family='Arial, sans-serif' font-size='34'>Player: ",
            achievement.nickname,
            "</text>",
            "<rect x='72' y='400' width='360' height='116' rx='18' fill='white' fill-opacity='.08' stroke='white' stroke-opacity='.18'/>",
            "<text x='102' y='448' fill='#8bb2ff' font-family='Arial, sans-serif' font-size='20' font-weight='700' letter-spacing='3'>SCORE</text>",
            "<text x='102' y='500' fill='white' font-family='Arial, sans-serif' font-size='52' font-weight='800'>",
            _toString(achievement.score),
            "</text>",
            "<text x='72' y='575' fill='white' fill-opacity='.55' font-family='Arial, sans-serif' font-size='20'>Token #",
            _toString(tokenId),
            " / ",
            shortAddress,
            " / Arc testnet</text>",
            "</svg>"
        );
    }

    function _levelName(uint8 levelId) private pure returns (string memory) {
        if (levelId == 1) return "Pay the Grid";
        if (levelId == 2) return "Finality Rush";
        if (levelId == 3) return "StableFX Corridor";
        if (levelId == 4) return "Agent Escrow";
        if (levelId == 5) return "Privacy Audit";
        return "Achievement Mint";
    }

    function _validNickname(string memory nickname) private pure returns (bool) {
        bytes memory value = bytes(nickname);
        if (value.length < 2 || value.length > 24) return false;

        for (uint256 index = 0; index < value.length; index++) {
            bytes1 char = value[index];
            bool isNumber = char >= 0x30 && char <= 0x39;
            bool isUpper = char >= 0x41 && char <= 0x5A;
            bool isLower = char >= 0x61 && char <= 0x7A;
            bool isSafeSymbol = char == 0x2D || char == 0x2E || char == 0x5F;
            if (!isNumber && !isUpper && !isLower && !isSafeSymbol) return false;
        }

        return true;
    }

    function _shortAddress(address account) private pure returns (string memory) {
        bytes20 data = bytes20(account);
        bytes16 alphabet = "0123456789abcdef";
        bytes memory result = new bytes(13);
        result[0] = bytes1("0");
        result[1] = bytes1("x");

        for (uint256 index = 0; index < 4; index++) {
            result[2 + index * 2] = alphabet[uint8(data[index] >> 4)];
            result[3 + index * 2] = alphabet[uint8(data[index] & 0x0f)];
        }

        result[10] = bytes1(".");
        result[11] = bytes1(".");
        result[12] = bytes1(".");
        return string(result);
    }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

library Base64 {
    string internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = TABLE;
        uint256 encodedLength = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLength + 32);

        assembly {
            mstore(result, encodedLength)

            let tablePtr := add(table, 1)
            let dataPtr := data
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 32)

            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 1), 0x3d)
                mstore8(sub(resultPtr, 2), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }

        return result;
    }
}
