import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, Edit, Trash2, Save, Settings, BookOpen, Calendar, ArrowLeft } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = ({ onBack }) => {
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('1');
  const [selectedLetter, setSelectedLetter] = useState('А');
  const [currentSchedule, setCurrentSchedule] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: []
  });
  const [newSubject, setNewSubject] = useState({
    name_kz: '',
    name_ru: '',
    color: 'blue'
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  const grades = Array.from({ length: 11 }, (_, i) => (i + 1).toString());
  const letters = ['А', 'Ә', 'Б', 'В'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'indigo', 'yellow', 'teal', 'cyan', 'rose'];

  // Load data
  useEffect(() => {
    loadSubjects();
    loadSchedules();
  }, []);

  const loadSubjects = async () => {
    try {
      const response = await axios.get(`${API}/school/subjects`);
      setSubjects(response.data);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить предметы",
        variant: "destructive"
      });
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await axios.get(`${API}/school/schedules`);
      setSchedules(response.data);
    } catch (error) {
      toast({
        title: "Ошибка", 
        description: "Не удалось загрузить расписания",
        variant: "destructive"
      });
    }
  };

  const loadScheduleForClass = async (grade, letter) => {
    try {
      const response = await axios.get(`${API}/school/schedules/${grade}/${letter}`);
      setCurrentSchedule(response.data.schedule);
    } catch (error) {
      // Schedule doesn't exist, reset to empty
      setCurrentSchedule({
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
      });
    }
  };

  useEffect(() => {
    if (selectedGrade && selectedLetter) {
      loadScheduleForClass(selectedGrade, selectedLetter);
    }
  }, [selectedGrade, selectedLetter]);

  // Subject management
  const createSubject = async () => {
    if (!newSubject.name_kz || !newSubject.name_ru) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля предмета",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/school/subjects`, newSubject);
      setNewSubject({ name_kz: '', name_ru: '', color: 'blue' });
      loadSubjects();
      toast({
        title: "Успешно",
        description: "Предмет добавлен"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.detail || "Не удалось добавить предмет",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (subjectId) => {
    try {
      await axios.delete(`${API}/school/subjects/${subjectId}`);
      loadSubjects();
      toast({
        title: "Успешно",
        description: "Предмет удален"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.detail || "Не удалось удалить предмет",
        variant: "destructive"
      });
    }
  };

  // Schedule management
  const addSubjectToDay = (day, subjectName) => {
    if (!subjectName) return;
    
    setCurrentSchedule(prev => ({
      ...prev,
      [day]: [...prev[day], subjectName]
    }));
  };

  const removeSubjectFromDay = (day, index) => {
    setCurrentSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };

  const saveSchedule = async () => {
    try {
      setLoading(true);
      
      // Check if schedule exists
      const existingSchedules = schedules.filter(s => 
        s.grade === parseInt(selectedGrade) && s.letter === selectedLetter
      );

      if (existingSchedules.length > 0) {
        // Update existing schedule
        await axios.put(`${API}/school/schedules/${selectedGrade}/${selectedLetter}`, {
          schedule: currentSchedule
        });
      } else {
        // Create new schedule
        await axios.post(`${API}/school/schedules`, {
          grade: parseInt(selectedGrade),
          letter: selectedLetter,
          schedule: currentSchedule
        });
      }

      loadSchedules();
      toast({
        title: "Успешно",
        description: `Расписание для ${selectedGrade}${selectedLetter} сохранено`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.detail || "Не удалось сохранить расписание",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к расписанию
            </Button>
            
            <div className="inline-flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Админ панель
              </h1>
            </div>

            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
          
          <p className="text-gray-600 text-lg">Управление расписанием школы</p>
          
          {user && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 mt-2">
              Вошли как: {user.username}
            </Badge>
          )}
        </div>

        <Tabs defaultValue="schedules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white shadow-md">
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Предметы
            </TabsTrigger>
          </TabsList>

          {/* Schedules Tab */}
          <TabsContent value="schedules">
            <div className="grid gap-6">
              {/* Class Selector */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Выбор класса для редактирования
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Label>Класс:</Label>
                      <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label>Буква:</Label>
                      <Select value={selectedLetter} onValueChange={setSelectedLetter}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {letters.map(letter => (
                            <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 px-4 py-2">
                      {selectedGrade}{selectedLetter} класс
                    </Badge>

                    <Button onClick={saveSchedule} disabled={loading} className="ml-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Сохранить расписание
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Editor */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Редактирование расписания для {selectedGrade}{selectedLetter}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {days.map((day, dayIndex) => (
                      <div key={day} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{dayNames[dayIndex]}</h3>
                          <div className="flex gap-2">
                            <Select onValueChange={(value) => addSubjectToDay(day, value)}>
                              <SelectTrigger className="w-64">
                                <SelectValue placeholder="Добавить предмет" />
                              </SelectTrigger>
                              <SelectContent>
                                {subjects.map(subject => (
                                  <SelectItem key={subject.id} value={`${subject.name_kz} / ${subject.name_ru}`}>
                                    {subject.name_kz} / {subject.name_ru}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {currentSchedule[day].map((subject, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-blue-50">
                                  {index + 1}
                                </Badge>
                                <span>{subject}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubjectFromDay(day, index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          
                          {currentSchedule[day].length === 0 && (
                            <div className="text-gray-500 text-center py-4 italic">
                              Нет уроков на этот день
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <div className="grid gap-6">
              {/* Add Subject */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Добавить новый предмет
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Название на казахском</Label>
                      <Input
                        placeholder="Математика"
                        value={newSubject.name_kz}
                        onChange={(e) => setNewSubject(prev => ({...prev, name_kz: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Название на русском</Label>
                      <Input
                        placeholder="Математика"
                        value={newSubject.name_ru}
                        onChange={(e) => setNewSubject(prev => ({...prev, name_ru: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Цвет</Label>
                      <Select value={newSubject.color} onValueChange={(color) => setNewSubject(prev => ({...prev, color}))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {colors.map(color => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded bg-${color}-200 border-2 border-${color}-300`}></div>
                                {color}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={createSubject} disabled={loading}>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subjects List */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Список предметов ({subjects.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {subjects.map(subject => (
                      <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded bg-${subject.color}-200 border-2 border-${subject.color}-300`}></div>
                          <div>
                            <div className="font-medium">{subject.name_kz}</div>
                            <div className="text-sm text-gray-600">{subject.name_ru}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSubject(subject.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {subjects.length === 0 && (
                      <Alert>
                        <AlertDescription>
                          Нет добавленных предметов. Добавьте предметы для создания расписаний.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;