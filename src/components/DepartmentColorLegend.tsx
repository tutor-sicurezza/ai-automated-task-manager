import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Palette } from '@phosphor-icons/react';
import { getAllDepartments, getDepartmentConfig } from '@/lib/departments';
import { DepartmentBadge } from '@/components/DepartmentBadge';

export function DepartmentColorLegend() {
  const [open, setOpen] = useState(false);
  const allDepartments = getAllDepartments();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Palette className="mr-2 h-4 w-4" weight="fill" />
        Department Colors
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" weight="fill" />
              Department Color Guide
            </DialogTitle>
            <DialogDescription>
              Visual reference for department color coding and icons used throughout the app
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
            <div className="space-y-3">
              {allDepartments.map((dept) => {
                const config = getDepartmentConfig(dept.name);
                const Icon = config.icon;

                return (
                  <Card key={dept.name} className="p-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-3 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <Icon 
                          className="h-6 w-6" 
                          weight="fill"
                          style={{ color: config.color }}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{dept.name}</h3>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {dept.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <DepartmentBadge 
                            departmentName={dept.name}
                            size="sm"
                            variant="default"
                          />
                          <DepartmentBadge 
                            departmentName={dept.name}
                            size="sm"
                            variant="outline"
                          />
                          <DepartmentBadge 
                            departmentName={dept.name}
                            size="sm"
                            variant="solid"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
