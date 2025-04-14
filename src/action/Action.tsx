import { Box } from "@mui/material";
import { useActionResizer } from "owlbear-utils";
import { useRef } from "react";

export function Action() {
    const box: React.RefObject<HTMLElement | null> = useRef(null);

    const BASE_HEIGHT = 300;
    const MAX_HEIGHT = 700;
    useActionResizer(BASE_HEIGHT, MAX_HEIGHT, box);

    return <Box ref={box}>TODO action</Box>;
}
