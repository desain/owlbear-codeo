import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import OBR, { type Item } from "@owlbear-rodeo/sdk";
import { Parameter } from "./Action"; // Assuming Parameter is exported from Action.tsx
import { ScriptContainerUtils } from "../state/ScriptContainerUtils";
import type { StoredScript, ParameterWithValue } from "../state/StoredScript";

// Mock OBR
vi.mock("@owlbear-rodeo/sdk", async (importOriginal) => {
    const actual = await importOriginal<typeof OBR>();
    return {
        ...actual,
        default: {
            player: {
                getSelection: vi.fn(),
            },
            scene: {
                items: {
                    getItems: vi.fn(),
                },
            },
            notification: {
                show: vi.fn(),
            },
        },
        // Keep other exports like isImage if they are used by the component
        isImage: actual.isImage,
    };
});

// Mock ScriptContainerUtils
vi.mock("../state/ScriptContainerUtils", () => ({
    ScriptContainerUtils: {
        setParameterValue: vi.fn(),
    },
    // Assuming withLocalAndRemoteContainers is used by handleSetParameterValue
    // and it just needs to execute the callback for testing purposes.
    withLocalAndRemoteContainers: vi.fn((callback) => callback(usePlayerStorage.getState().roomMetadata.scripts)),
}));

// Mock usePlayerStorage if needed for withLocalAndRemoteContainers or other hooks
// This is a simplified mock. If the actual implementation relies on specific state, adjust accordingly.
const mockPlayerStorageState = {
    roomMetadata: {
        scripts: new Map(), // Or some other appropriate initial value
    },
    // Add other state properties if the component/hooks depend on them
};
vi.mock("../state/usePlayerStorage", () => ({
    usePlayerStorage: vi.fn((selector) => selector(mockPlayerStorageState)),
}));


describe("Parameter component with ItemList type", () => {
    const mockScript: StoredScript = {
        id: "test-script",
        name: "Test Script",
        code: "",
        author: "Test Author",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parameters: [], // Will be populated by the param below
        // Add other StoredScript properties if necessary
    };

    const baseItemListParam: Omit<ParameterWithValue, "value"> = {
        name: "itemListParam",
        description: "Select Multiple Items",
        type: "ItemList",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mockPlayerStorageState if necessary for isolation between tests
        mockPlayerStorageState.roomMetadata.scripts = new Map(); 
    });

    describe("Rendering", () => {
        it('should display "Set Multi-Selection" when value is undefined', () => {
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: undefined } as ParameterWithValue}
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
                    param={{ ...baseItemListParam, value: [] } as ParameterWithValue}
                    idx={0}
                />,
            );
            expect(screen.getByText("Set Multi-Selection")).toBeInTheDocument();
        });

        it('should display "1 item(s) selected" when value has one item', () => {
            const mockItem: Item = { id: "item1", layer: "CHARACTER", name:"Item 1", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{}};
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: [mockItem] } as ParameterWithValue}
                    idx={0}
                />,
            );
            expect(screen.getByText("1 item(s) selected")).toBeInTheDocument();
        });

        it('should display "2 item(s) selected" when value has two items', () => {
            const mockItems: Item[] = [
                { id: "item1", layer: "CHARACTER", name:"Item 1", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{}},
                { id: "item2", layer: "CHARACTER", name:"Item 2", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{}},
            ];
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: mockItems } as ParameterWithValue}
                    idx={0}
                />,
            );
            expect(screen.getByText("2 item(s) selected")).toBeInTheDocument();
        });
    });

    describe("Selection Logic", () => {
        const mockPlayerGetSelection = OBR.player.getSelection as vi.Mock;
        const mockSceneGetItems = OBR.scene.items.getItems as vi.Mock;
        const mockNotificationShow = OBR.notification.show as vi.Mock;

        it("should set parameter value with selected items on successful selection", async () => {
            const selectedIds = ["item1-id", "item2-id"];
            const selectedItems: Item[] = [
                { id: "item1-id", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{} },
                { id: "item2-id", name: "Item 2", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{} },
            ];
            mockPlayerGetSelection.mockResolvedValue(selectedIds);
            mockSceneGetItems.mockResolvedValue(selectedItems);

            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: undefined } as ParameterWithValue}
                    idx={0}
                />,
            );

            fireEvent.click(screen.getByText("Set Multi-Selection"));

            await waitFor(() => {
                expect(mockPlayerGetSelection).toHaveBeenCalled();
                expect(mockSceneGetItems).toHaveBeenCalledWith(selectedIds);
                expect(ScriptContainerUtils.setParameterValue).toHaveBeenCalledWith(
                    mockPlayerStorageState.roomMetadata.scripts,
                    mockScript.id,
                    0,
                    selectedItems,
                );
            });
        });

        it("should show notification and not set value if no items are selected", async () => {
            mockPlayerGetSelection.mockResolvedValue([]);

            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: undefined } as ParameterWithValue}
                    idx={0}
                />,
            );

            fireEvent.click(screen.getByText("Set Multi-Selection"));

            await waitFor(() => {
                expect(mockPlayerGetSelection).toHaveBeenCalled();
                expect(mockNotificationShow).toHaveBeenCalledWith(
                    "No items selected",
                    "INFO",
                );
                expect(mockSceneGetItems).not.toHaveBeenCalled();
                expect(ScriptContainerUtils.setParameterValue).not.toHaveBeenCalled();
            });
        });
        
        it("should show notification and clear value if selected items cannot be retrieved", async () => {
            const selectedIds = ["item1-id"];
            mockPlayerGetSelection.mockResolvedValue(selectedIds);
            mockSceneGetItems.mockResolvedValue([]); // Items not found

            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: [{ id: "old-item", name:"Old Item", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{} }] } as ParameterWithValue}
                    idx={0}
                />,
            );
            
            // Initial state shows "1 item(s) selected"
            expect(screen.getByText("1 item(s) selected")).toBeInTheDocument();

            fireEvent.click(screen.getByText("1 item(s) selected")); // or the chip itself

            await waitFor(() => {
                expect(mockPlayerGetSelection).toHaveBeenCalled();
                expect(mockSceneGetItems).toHaveBeenCalledWith(selectedIds);
                expect(mockNotificationShow).toHaveBeenCalledWith(
                    "Could not retrieve selected items.",
                    "WARNING",
                );
                expect(ScriptContainerUtils.setParameterValue).toHaveBeenCalledWith(
                    mockPlayerStorageState.roomMetadata.scripts,
                    mockScript.id,
                    0,
                    undefined, // Value should be cleared
                );
            });
        });
    });

    describe("Clearing Selection", () => {
        it("should call setParameterValue with undefined when delete is clicked", async () => {
            const mockItem: Item = { id: "item1", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{} };
            render(
                <Parameter
                    editingDisabled={false}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: [mockItem] } as ParameterWithValue}
                    idx={0}
                />,
            );

            // The delete icon is usually part of the Chip component and not directly accessible by role
            // We target the Chip's delete handler. Material UI Chip has a specific structure.
            // We can find the cancel icon by its role if it's standard.
            const deleteIcon = screen.getByTestId("CancelIcon"); // MUI specific, ensure this is how it's rendered or use a more generic selector
            fireEvent.click(deleteIcon);

            await waitFor(() => {
                expect(ScriptContainerUtils.setParameterValue).toHaveBeenCalledWith(
                    mockPlayerStorageState.roomMetadata.scripts,
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
                    param={{ ...baseItemListParam, value: [] } as ParameterWithValue}
                    idx={0}
                />,
            );
            // Check if the delete icon is not present
            expect(screen.queryByTestId("CancelIcon")).not.toBeInTheDocument();
        });
    });
    
    describe("Disabled State", () => {
        it("should disable the chip when editingDisabled is true", () => {
            const mockItem: Item = { id: "item1", name: "Item 1", layer:"CHARACTER", type: "SHAPE", visible: true, locked: false, position: {x:0,y:0}, rotation:0, scale: {x:1,y:1}, zIndex:0, metadata:{} };
            render(
                <Parameter
                    editingDisabled={true}
                    script={mockScript}
                    param={{ ...baseItemListParam, value: [mockItem] } as ParameterWithValue}
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
            expect(OBR.player.getSelection as vi.Mock).not.toHaveBeenCalled();
        });
    });
});
