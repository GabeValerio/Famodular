# Famodular Changelog

## Recent Changes

### December 21, 2025

#### Plants Module Updates
- **Grid Layout**: Updated to 2-column grid on mobile, 4 on tablet, and 5 on desktop for better visibility.
- **Card Redesign**: 
  - Images now take the full width of the card (removed padding).
  - Removed "Common Name" and "Location" fields from the card view for a cleaner look.
  - Simplified information display below the image.
- **Add Plant Workflow**: 
  - Merged "Add Plant from Photo" into the main "Add Plant" modal.
  - Added "Start with a Photo" option within the modal.
  - Edit modal now displays the current plant image.
- **UI Refinements**:
  - Updated primary buttons from purple to black.
  - Aligned "Add Plant" button with the header on mobile.
  - Removed "Track and care for your plants" subtitle.
  - Updated "Analyze Plant" button style and added explanatory text.
- **Bug Fixes**: Fixed an issue where plant images would disappear after performing actions like watering.

#### Check-ins Module Updates
- **Removed subtitle text**: Removed "How is everyone feeling today?" from the check-ins header
- **Relocated AI Summary button**: Moved "Get AI Summary" button from top header to bottom of page
- **Header adjustments**: Reduced padding between navbar and header, renamed "Family Check-ins" to "Check In"
- **UI cleanup**: Removed "Share How You're Feeling" heading from the mood selection form
- **Mobile improvements**: Added dropdown for mood selection on mobile devices with alphabetical sorting and inline label layout
- **Feature removal**: Removed the "Generate Family Questions" feature while preserving existing question display/answering functionality

#### Goals Module Updates
- **Header rename**: Changed "Family Ambitions" to "Goals" for clarity
- **Removed filters**: Eliminated "All", "Family", and "Personal" filter buttons for simplified interface
- **Removed AI features**: Completely removed "Get Tips" AI functionality from goal cards
- **Updated timeframes**: Changed available timeframes from "1 Year, 3 Years, 5 Years, 10 Years" to "6 Months, 1 Year, 3 Years, 5 Years"
- **Owner selection**: Added "Whose goal is this?" dropdown in Add Goal modal allowing selection of group name for family goals or individual members
- **Layout redesign**: Replaced card-based grid with clean list layout showing owner avatars, goal titles, timeframes, and progress bars
- **View controls**: Added timeframe filter button (1 Year view vs All timeframes) and member filter dropdown (All/Family/Individual members)
- **Database integration**: Fixed API routes to properly save/load goals from Supabase with correct field mapping (ownerId ↔ owner_id)
- **Authentication**: Implemented proper user authentication and group membership verification for goal operations

#### Dashboard & Navigation Updates
- **Navbar Layout**: Moved User/Group Avatar from left to right side of the navigation bar.
- **Dropdown Positioning**: Adjusted Group Dropdown menu to open from the right edge to prevent overflow.

### Technical Notes
- All changes maintain existing functionality for mood tracking and question answering
- Mobile responsiveness improved with dropdown interface for smaller screens
- Component interfaces cleaned up to remove unused props
- Goals module now fully integrated with Supabase database with proper authentication and authorization
- API routes updated with comprehensive error handling and field validation
- Database schema updated to support new timeframe options and member ownership
- Build passes successfully with no compilation errors
