import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  GripVertical,
  FileText,
  Check,
  X
} from 'lucide-react';
import { MOUClause } from '@/types/database';

interface ClauseEditorProps {
  clauses: MOUClause[];
  onClausesChange: (clauses: MOUClause[]) => void;
  isEditable: boolean;
  currentUniversityId?: string;
}

const CLAUSE_CATEGORIES = [
  { value: 'governance', label: 'Governance' },
  { value: 'academic', label: 'Academic Cooperation' },
  { value: 'financial', label: 'Financial Terms' },
  { value: 'mobility', label: 'Student/Staff Mobility' },
  { value: 'research', label: 'Research Collaboration' },
  { value: 'termination', label: 'Termination & Dispute' },
  { value: 'general', label: 'General Provisions' },
];

export function ClauseEditor({ 
  clauses, 
  onClausesChange, 
  isEditable,
  currentUniversityId 
}: ClauseEditorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClause, setEditingClause] = useState<MOUClause | null>(null);
  const [newClause, setNewClause] = useState({ title: '', content: '', category: 'general' });

  const handleAddClause = () => {
    if (!newClause.title.trim() || !newClause.content.trim()) return;
    
    const clause: MOUClause = {
      id: crypto.randomUUID(),
      title: newClause.title,
      content: newClause.content,
      proposed_by: currentUniversityId || 'unknown',
    };
    
    onClausesChange([...clauses, clause]);
    setNewClause({ title: '', content: '', category: 'general' });
    setIsAddDialogOpen(false);
  };

  const handleUpdateClause = () => {
    if (!editingClause) return;
    
    onClausesChange(
      clauses.map(c => c.id === editingClause.id ? editingClause : c)
    );
    setEditingClause(null);
  };

  const handleDeleteClause = (id: string) => {
    onClausesChange(clauses.filter(c => c.id !== id));
  };

  const getCategoryBadge = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('governance') || lowerTitle.includes('committee')) return 'governance';
    if (lowerTitle.includes('academic') || lowerTitle.includes('program')) return 'academic';
    if (lowerTitle.includes('financial') || lowerTitle.includes('cost') || lowerTitle.includes('fee')) return 'financial';
    if (lowerTitle.includes('mobility') || lowerTitle.includes('exchange') || lowerTitle.includes('student')) return 'mobility';
    if (lowerTitle.includes('research') || lowerTitle.includes('publication')) return 'research';
    if (lowerTitle.includes('termination') || lowerTitle.includes('dispute')) return 'termination';
    return 'general';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'governance': return 'bg-purple-500/10 text-purple-600';
      case 'academic': return 'bg-blue-500/10 text-blue-600';
      case 'financial': return 'bg-green-500/10 text-green-600';
      case 'mobility': return 'bg-amber-500/10 text-amber-600';
      case 'research': return 'bg-pink-500/10 text-pink-600';
      case 'termination': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Agreement Clauses ({clauses.length})
        </h3>
        {isEditable && (
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Clause
          </Button>
        )}
      </div>

      {clauses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No clauses added yet</p>
            {isEditable && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add Your First Clause
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clauses.map((clause, index) => {
            const category = getCategoryBadge(clause.title);
            return (
              <Card key={clause.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{clause.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`mt-1 text-xs ${getCategoryColor(category)}`}
                          >
                            {CLAUSE_CATEGORIES.find(c => c.value === category)?.label || 'General'}
                          </Badge>
                        </div>
                        {isEditable && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingClause(clause)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteClause(clause.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {clause.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Clause Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Clause</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Clause Title</label>
              <Input
                placeholder="e.g., Student Exchange Program"
                value={newClause.title}
                onChange={(e) => setNewClause({ ...newClause, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={newClause.category} 
                onValueChange={(value) => setNewClause({ ...newClause, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAUSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Clause Content</label>
              <Textarea
                placeholder="Enter the full text of the clause..."
                value={newClause.content}
                onChange={(e) => setNewClause({ ...newClause, content: e.target.value })}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClause} disabled={!newClause.title || !newClause.content}>
              Add Clause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Clause Dialog */}
      <Dialog open={!!editingClause} onOpenChange={() => setEditingClause(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Clause</DialogTitle>
          </DialogHeader>
          {editingClause && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Clause Title</label>
                <Input
                  value={editingClause.title}
                  onChange={(e) => setEditingClause({ ...editingClause, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Clause Content</label>
                <Textarea
                  value={editingClause.content}
                  onChange={(e) => setEditingClause({ ...editingClause, content: e.target.value })}
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClause(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClause}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
