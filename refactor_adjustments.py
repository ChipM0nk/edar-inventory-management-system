#!/usr/bin/env python3
"""
Script to refactor adjustments page by replacing dialogs with components
"""

def refactor_file():
    file_path = 'frontend/app/inventory/adjustments/page.tsx'
    
    # Read the file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace the Adjustment Detail Modal (lines 1006-1374)
    old_dialog_start = "      {/* Adjustment Detail Modal */}\n      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>"
    new_dialog = """      {/* Adjustment Detail Modal */}
      <AdjustmentDetailsDialog
        adjustment={selectedAdjustment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />"""
    
    # Find and replace - we need to find from start to end
    start_marker = old_dialog_start
    end_marker = "      </Dialog>\n\n      {/* Create Adjustment Modal */}"
    
    start_pos = content.find(start_marker)
    end_pos = content.find(end_marker, start_pos)
    
    if start_pos != -1 and end_pos != -1:
        # Replace the section
        before = content[:start_pos]
        after = content[end_pos:].replace("      </Dialog>\n\n      {/* Create Adjustment Modal */}", "\n\n      {/* Create Adjustment Modal */}", 1)
        content = before + new_dialog + after
        print(f"✓ Replaced Adjustment Details Dialog (from pos {start_pos} to {end_pos})")
    else:
        print(f"✗ Could not find Adjustment Details Dialog section")
        print(f"  start_pos: {start_pos}, end_pos: {end_pos}")
        return
    
    # Replace the Review Dialog (around lines 1901-1967)
    review_start = "      {/* Review & Confirm Dialog */}\n      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>"
    review_replacement = """      {/* Review & Confirm Dialog */}
      <AdjustmentReviewDialog
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={() => { setIsReviewOpen(false); handleCreateAdjustment() }}
        items={adjustmentItems}
        processedBy={user ? `${user.first_name} ${user.last_name}` : ''}
        adjustmentDate={adjustmentDate}
        warehouseName={selectedWarehouse?.name || ''}
      />"""
    
    review_end = "      </Dialog>\n\n      {/* Document Viewer Dialog */}"
    
    start_pos = content.find(review_start)
    end_pos = content.find(review_end, start_pos)
    
    if start_pos != -1 and end_pos != -1:
        before = content[:start_pos]
        after = content[end_pos:].replace("      </Dialog>\n\n      {/* Document Viewer Dialog */}", "\n\n      {/* Document Viewer Dialog */}", 1)
        content = before + review_replacement + after
        print(f"✓ Replaced Review Dialog (from pos {start_pos} to {end_pos})")
    else:
        print(f"✗ Could not find Review Dialog section")
        print(f"  start_pos: {start_pos}, end_pos: {end_pos}")
    
    # Write the file back
    with open(file_path, 'w') as f:
        f.write(content)
    
    # Count lines
    lines = content.count('\n') + 1
    print(f"\n✓ Refactoring complete!")
    print(f"  Original: 1989 lines")
    print(f"  New: {lines} lines")
    print(f"  Reduced by: {1989 - lines} lines ({((1989 - lines) / 1989 * 100):.1f}%)")

if __name__ == '__main__':
    refactor_file()

