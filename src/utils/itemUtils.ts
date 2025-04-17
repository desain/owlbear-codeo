import { Image, isImage, Item } from "@owlbear-rodeo/sdk";

export function getName(item: Image | Item): string {
    if (isImage(item) && item.text.plainText) {
        return item.text.plainText;
    }
    return item.name;
}
