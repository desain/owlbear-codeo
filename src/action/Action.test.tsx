import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'; // Explicit imports, added Mock
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import type { ScriptParameter } from "../script/CodeoScript";
import { Parameter } from "./Action";
import { ScriptContainerUtils } from "../state/ScriptContainerUtils";
import type { StoredScript } from "../state/StoredScript";
import { usePlayerStorage } from "../state/usePlayerStorage";

import type { PlayerStorage } from "../state/usePlayerStorage"; // For typing mocks
import type { ScriptContainer } from "../state/ScriptContainerUtils"; // For typing mocks
import type { WritableDraft } from "immer"; // For typing mocks

// Mock OBR SDK
vi.mock("@owlbear-rodeo/sdk", async (importOriginal) => {
    type ActualSDK = typeof import("@owlbear-rodeo/sdk");
    const actualSDK = await importOriginal<ActualSDK>();
    return {
        ...actualSDK, // Spread all actual named exports (includes isImage, buildCurve, etc.)
        default: { // Mock the default OBR object
            // Keep existing mocks for specific OBR functionalities if needed by Parameter component indirectly
            // For 'Parameter' component, direct OBR usage is mainly for OBR.player.getSelection, OBR.scene.items.getItems, OBR.notification.show
            player: {
                getSelection: vi.fn(),
                select: vi.fn(), // Added missing select mock from conceptual example
            },
            scene: {
                items: {
                    getItems: vi.fn(),
                },
            },
            notification: {
                show: vi.fn(),
            },
            // Add other OBR default properties if they are accessed and need mocking
            // For instance, if OBR.isReady or OBR.onReady are used. Based on Action.tsx, they are not directly by Parameter.
        },
    };
});

// Mock ScriptContainerUtils
vi.mock("../state/ScriptContainerUtils", () => ({
    ScriptContainerUtils: {
        setParameterValue: vi.fn(),
    },
    // Assuming withLocalAndRemoteContainers is used by handleSetParameterValue
    // and it just needs to execute the callback for testing purposes.
    withLocalAndRemoteContainers: vi.fn((callback: (draft: WritableDraft<ScriptContainer>) => void) => {
        const state = usePlayerStorage.getState() as PlayerStorage; // Cast for safety
        // This mock implementation of withLocalAndRemoteContainers might need to be more sophisticated
        // if the actual callback relies on immer drafts or specific container structures.
        // For now, we'll assume it can work with a simplified container or direct state.
        // If ScriptContainer is just { scripts: StoredScript[] }, this could be:
        // callback({ scripts: state.roomMetadata.scripts as unknown as StoredScript[] });
        // However, the original mock passed state.roomMetadata.scripts, which is a Map.
        // This part is tricky without knowing the exact expectation of the callback.
        // Let's assume for now the callback expects a structure that can be derived from state.roomMetadata
        // For simplicity, we'll pass a compatible structure if possible, or adjust if tests fail here.
        // The original mock passed `state.roomMetadata.scripts` which is a Map.
        // The `updater` in the real code expects `WritableDraft<ScriptContainer>`.
        // This mock needs to provide something compatible with that.
        // A simple approach:
        const mockDraftContainer: WritableDraft<ScriptContainer> = { scripts: Array.from(state.roomMetadata.scripts.values()) };
        return callback(mockDraftContainer);
    }),
}));

// Mock usePlayerStorage
// Adjusted mockPlayerStorageState structure
const mockPlayerStorageState: PlayerStorage = {
    roomMetadata: { scripts: [] as StoredScript[] } as ScriptContainer,
    scripts: [] as StoredScript[], // This is likely the store for local scripts
    executions: new Map(),
    role: "GM",
    playerName: "TestPlayer",
    // playerId: "test-player-id", // Removed as it's not in PlayerStorage type
    // isReady: true, // Removed as it's not in PlayerStorage type
    addLocalScript: vi.fn(),
    getScriptById: vi.fn(),
    // updateLocalStateContainer's updater operates on a ScriptContainer.
    // We'll mock it to operate on an object { scripts: mockPlayerStorageState.scripts }
    updateLocalStateContainer: vi.fn((updater) => {
        const localScriptContainer: WritableDraft<ScriptContainer> = { scripts: mockPlayerStorageState.scripts };
        updater(localScriptContainer);
    }),
    markScriptRun: vi.fn(),
    addExecution: vi.fn(),
    removeExecution: vi.fn(),
    // getState is not part of PlayerStorage state object, it's part of the store itself.
    // So, it's removed from mockPlayerStorageState.
};

// Properly mock the Zustand store pattern for usePlayerStorage
const mockedUsePlayerStorageHook = vi.fn(<TSelected = unknown>(selector: (store: PlayerStorage) => TSelected) => {
    return selector(mockPlayerStorageState);
});
const mockedGetState = () => mockPlayerStorageState;

vi.mock("../state/usePlayerStorage", () => ({
    usePlayerStorage: Object.assign(mockedUsePlayerStorageHook, {
        getState: mockedGetState,
    }),
}));


describe("Parameter component with ItemList type", () => {
    const mockScript: StoredScript = {
        id: "test-script",
        name: "Test Script",
        code: "",
        author: "Test Author",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        runAt: Date.now(), 
        parameters: [], 
    };

    // baseItemListParam now correctly uses the imported ScriptParameter type
    const baseItemListParam: ScriptParameter = { 
        name: "itemListParam",
        description: "Select Multiple Items",
        type: "ItemList", // Set to "ItemList" directly
    };

    const mockDate = new Date().toISOString();
    const mockUserId = "test-user-id";

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset contents of mutable parts of mockPlayerStorageState
        if (mockPlayerStorageState.roomMetadata?.scripts) {
            mockPlayerStorageState.roomMetadata.scripts.length = 0;
        }
        // Reset the local scripts array directly
        mockPlayerStorageState.scripts.length = 0; 
        mockPlayerStorageState.executions.clear();
        
        // Also reset mocks on OBR's default export methods and other vi.fn()
        (OBR.player.getSelection as Mock).mockClear();
        (OBR.scene.items.getItems as Mock).mockClear();
        (OBR.notification.show as Mock).mockClear();
        (ScriptContainerUtils.setParameterValue as Mock).mockClear();

    });

    describe("Rendering", () => {
        it('should display "Set Multi-Selection" when value is undefined', () => {
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: undefined }}
                    idx={0}
                />,
            );
            expect(screen.getByText("Set Multi-Selection")).toBeInTheDocument();
        });

        it('should display "Set Multi-Selection" when value is an empty array', () => {
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: [] }}
                    idx={0}
                />,
            );
            expect(screen.getByText("Set Multi-Selection")).toBeInTheDocument();
        });

        it('should display "1 item(s) selected" when value has one item', () => {
            const mockItem: Item = { 
                id: "item1", layer: "CHARACTER", name:"Item 1", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId, 
            };
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: [mockItem] }}
                    idx={0}
                />,
            );
            expect(screen.getByText("1 item(s) selected")).toBeInTheDocument();
        });

        it('should display "2 item(s) selected" when value has two items', () => {
            const mockItems: Item[] = [
                { 
                    id: "item1", layer: "CHARACTER", name:"Item 1", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                    createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                },
                {
                    id: "item2", layer: "CHARACTER", name:"Item 2", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                    createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                },
            ];
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: mockItems }}
                    idx={0}
                />,
            );
            expect(screen.getByText("2 item(s) selected")).toBeInTheDocument();
        });
    });

    describe("Selection Logic", () => {
        // Component uses OBR.player.getSelection, so mock OBR.player.getSelection directly
        // The mock structure for default export handles this.
        // We cast OBR.player.getSelection to Mock (imported from vitest) when setting up mock behavior for a test.
        it("should set parameter value with selected items on successful selection", async () => {
            (OBR.player.getSelection as Mock).mockResolvedValue(["item1-id", "item2-id"]);
            (OBR.scene.items.getItems as Mock).mockResolvedValue([
                { 
                    id: "item1-id", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                    createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                },
                { 
                    id: "item2-id", name: "Item 2", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                    createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                },
            ]);
            // Removed unused selectedIds and selectedItems variables

            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: undefined }}
                    idx={0}
                />,
            );

            fireEvent.click(screen.getByText("Set Multi-Selection"));

            await waitFor(() => {
                expect(OBR.player.getSelection).toHaveBeenCalled();
                expect(OBR.scene.items.getItems).toHaveBeenCalledWith(["item1-id", "item2-id"]);
                expect(ScriptContainerUtils.setParameterValue).toHaveBeenCalledWith(
                    // The mock for withLocalAndRemoteContainers passes a ScriptContainer draft
                    // The assertion here should match what that draft would look like.
                    // If it's { scripts: Array.from(state.roomMetadata.scripts.values()) }
                    // then this check needs to be consistent.
                    // For now, assuming the mockPlayerStorageState.roomMetadata.scripts (Map) was intended,
                    // but this is likely where the `unbound-method` or `no-unsafe-call` could stem from if types mismatch.
                    // Let's assume the actual check is on the content:
                    // The first argument to setParameterValue is the container.
                    // In the mocked withLocalAndRemoteContainers, we pass mockDraftContainer.
                    // So, we expect that specific structure (or a matcher for it).
                    mockPlayerStorageState.roomMetadata, // This should now be {scripts: []}
                    mockScript.id,
                    0,
                    // The actual items from the getItems mock
                    [ 
                        { 
                            id: "item1-id", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                            createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                        },
                        { 
                            id: "item2-id", name: "Item 2", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                            createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                        },
                    ]
                );
            });
        });

        it("should show notification and not set value if no items are selected", async () => {
            (OBR.player.getSelection as Mock).mockResolvedValue([]);

            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: undefined }}
                    idx={0}
                />,
            );

            fireEvent.click(screen.getByText("Set Multi-Selection"));

            await waitFor(() => {
                expect(OBR.player.getSelection).toHaveBeenCalled();
                expect(OBR.notification.show).toHaveBeenCalledWith("No items selected", "INFO");
                expect(OBR.scene.items.getItems).not.toHaveBeenCalled();
                expect(ScriptContainerUtils.setParameterValue).not.toHaveBeenCalled();
            });
        });
        
        it("should show notification and clear value if selected items cannot be retrieved", async () => {
            (OBR.player.getSelection as Mock).mockResolvedValue(["item1-id"]);
            (OBR.scene.items.getItems as Mock).mockResolvedValue([]); 

            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: [{ 
                        id: "old-item", name:"Old Item", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                        createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
                    }] }}
                    idx={0}
                />,
            );
            
            expect(screen.getByText("1 item(s) selected")).toBeInTheDocument();

            fireEvent.click(screen.getByText("1 item(s) selected")); 

            await waitFor(() => {
                expect(OBR.player.getSelection).toHaveBeenCalled();
                expect(OBR.scene.items.getItems).toHaveBeenCalledWith(["item1-id"]);
                expect(OBR.notification.show).toHaveBeenCalledWith("Could not retrieve selected items.", "WARNING");
                expect(ScriptContainerUtils.setParameterValue).toHaveBeenCalledWith(
                    mockPlayerStorageState.roomMetadata,
                    mockScript.id,
                    0,
                    undefined, // Value should be cleared
                );
            });
        });
    });

    describe("Clearing Selection", () => {
        it("should call setParameterValue with undefined when delete is clicked", async () => {
            const mockItem: Item = { 
                id: "item1", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
            };
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: [mockItem] }}
                    idx={0}
                />,
            );

            const deleteIcon = screen.getByTestId("CancelIcon"); 
            fireEvent.click(deleteIcon);

            await waitFor(() => {
                expect(ScriptContainerUtils.setParameterValue).toHaveBeenCalledWith(
                    mockPlayerStorageState.roomMetadata,
                    mockScript.id,
                    0,
                    undefined,
                );
            });
        });

        it("should not have a delete handler if no items are selected", () => {
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: [] }}
                    idx={0}
                />,
            );
            // Check if the delete icon is not present
            expect(screen.queryByTestId("CancelIcon")).not.toBeInTheDocument();
        });
    });
    
    describe("Disabled State", () => {
        it("should disable the chip when editingDisabled is true", () => {
            const mockItem: Item = { 
                id: "item1", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{},
                createdUserId: mockUserId, lastModified: mockDate, lastModifiedUserId: mockUserId,
            };
            render(
                <Parameter
                    editingDisabled={true}
                    script={mockScript}
                    param={{ ...baseItemListParam, type: "ItemList", value: [mockItem] }}
                    idx={0}
                />,
            );
            // The Chip component itself will have the 'Mui-disabled' class or 'disabled' attribute
            // The exact way to check depends on how Chip is rendered and its props
            // We can check if the underlying button/div is disabled
            // For MUI Chip, the root element gets `Mui-disabled` class.
            const chip = screen.getByText("1 item(s) selected").closest(".MuiChip-root");
            expect(chip).toHaveClass("Mui-disabled");

            // Try to click to ensure no action happens (though true disabled state prevents event firing)
            fireEvent.click(chip!);
            expect(OBR.player.getSelection as Mock).not.toHaveBeenCalled(); // Check against OBR.player.getSelection
        });
    });
});
