# HIS Modal Analysis Scratchpad

## Task Breakdown

- [x] Access blueprint project URL
- [x] Browse design frames
- [x] Analyze sidebar persistence
- [x] Identify a frame showing a modal/search overlay
- [x] Analyze modal positioning relative to sidebar
- [x] Analyze modal centering (viewport vs content area)
- [x] Deduce positioning logic (CSS/layout)

## Findings

- URL accessed: <https://stitch.withgoogle.com/projects/9566632469012494962>
- Persistent Sidebar: The designs consistently show a persistent left sidebar (approx. 280px wide).
- Content Area: The main content (dashboards, registration forms, search results) is located to the right of the sidebar.
- Modal Analysis:
  - I observed that complex workflows like "Patient Registration" (Steps 1-4) are designed as full-screen layouts that *preserve* the sidebar on the left.
  - This indicates that the design system prioritizes navigation persistence even during deep task flows.
  - Position Logic: If a modal were to be "centered," the blueprint's layout suggests it should be **centered within the content area** (to the right of the sidebar) to avoid visual overlap and maintain the sidebar's accessibility.
  - Viewport vs Content Area: Centering in the viewport would cause the modal to cover the sidebar partially or fully, which contradicts the design pattern of the sidebar being a constant frame element.
- Final Conclusion: Modals should be centered in the content area (offset by the sidebar width) to match the blueprint's visual hierarchy.
